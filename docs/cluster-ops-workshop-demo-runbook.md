# Cluster operations workshop: demo runbook

Companion to the `cluster-ops-workshop` preset (branch `workshop-cluster-ops`). The slide deck carries the talk track in its speaker notes. This document is the hands-on side: every API to run, every Kibana screen to open, what to say it shows, and what to prepare beforehand.

The demo is 15 of the 30 minutes: a health check first, then four stops that cover the eight topics, two per stop. Everything runs from Kibana Dev Tools plus a handful of management screens.

Scope: self-managed and Elastic Cloud Hosted. Serverless has no node-level APIs and manages lifecycle with data stream lifecycle only, so most of this does not apply to it.

Run each request once during pre-flight. Field names in responses shift slightly between versions, and `total_field_count` and the data stream lifecycle indicator need a recent 8.x or later.

## Run sheet

| Stop | Topics | Time | Main screen |
|---|---|---|---|
| 0. Health first | all | 3 min | Dev Tools |
| 1. Shards and memory | 1 shard strategy, 2 heap and JVM | 3 min | Dev Tools, Stack Monitoring |
| 2. Mappings and lifecycle | 3 mapping, 4 lifecycle and tiering | 3 min | Dev Tools, Index Lifecycle Policies |
| 3. Capacity and ingest | 5 capacity, 6 ingest backpressure | 3 min | Dev Tools, Stack Monitoring |
| 4. Queries and recovery | 7 query performance, 8 resilience | 3 min | Dev Tools, Search Profiler, Snapshot and Restore |

If time runs short, cut the mapping detail in stop 2 and keep `_ilm/explain`. Never cut stop 0.

## Pre-flight

Do these the day before and again ten minutes before.

1. Open Dev Tools and save one tab per stop, with the requests below already pasted in. Nobody should watch you type URLs.
2. Confirm Stack Monitoring has data. It needs monitoring data from the cluster (Elastic Agent or Metricbeat). Open Stack Monitoring, Nodes, and check the charts are populated. On Elastic Cloud Hosted the charts live in the monitoring deployment's Kibana, not the lab deployment's. AutoOps covers similar ground on Elastic Cloud Hosted, and on self-managed through Cloud Connect; check availability for your version.
3. Seed the lab so each diagnostic returns something worth showing:
   - An oversharded index family: many tiny indices or an index with far too many primaries, so `_cat/shards` shows a long tail of small shards.
   - One unassigned replica (set replicas higher than the data node count on a small index) so health goes yellow and `allocation/explain` has something to explain.
   - One index with a wide dynamic mapping (a document with many unique keys) for the field count demo.
   - One ILM policy with an index stuck in an error step, for `_ilm/explain`.
   - A snapshot repository with at least one snapshot, and an SLM policy.
   - One deliberately slow search for stop 4: a leading wildcard on a large keyword field, or a terms aggregation on a high-cardinality field of a large index. Keep it ready in a second Dev Tools tab or run it as an async search.
   - Check that `GET *,.ds-*/_ilm/explain` returns data stream backing indices. Wildcards skip hidden indices unless a pattern names them explicitly.
   - If you want live 429s, a short bulk load against a small cluster. Otherwise show the thread pool counters and say what a rising `rejected` means.
4. Note the name of the lab space and the user you will demo as. The simplest option in a lab is a superuser. Otherwise the user needs the `monitor`, `manage_ilm`, `manage_slm` and `manage` cluster privileges (the last for restore, cancelling tasks and reading cluster settings), `manage` on the indices for slow log settings, and the `monitoring_user` role for Stack Monitoring.
5. Reset the cluster to a known state afterwards: remove the restore target index, reset any settings you changed.

## Stop 0: health first (3 min)

The point: one call tells you where to look. Start every investigation here and let the result choose the next stop.

| API | What it shows | What to say |
|---|---|---|
| `GET _cat/health?v` | One line: status, node count, shards, unassigned shards, pending tasks | The glance. Cluster status covers shards only: green all assigned, yellow a replica missing, red a primary missing. The health report can be yellow for disk, ILM or snapshots while this stays green. |
| `GET _cluster/health?level=indices` | Status per index | Finds which index is yellow or red. `level=shards` goes one step deeper. |
| `GET _cluster/health?wait_for_status=yellow&timeout=30s` | Blocks until the status is reached | Useful in scripts and rolling restarts. Optional. |
| `GET _health_report` | Every indicator with status, symptom, impact and diagnosis | The one to teach. It names the cause and the action to try. |
| `GET _health_report/shards_availability` | One indicator in detail | Drill into the indicator that is not green. |
| `GET _health_report?verbose=false` | Faster pass without the detail | For quick checks and alerting scripts. |
| `GET _cluster/pending_tasks` | Queue of cluster state changes waiting on the master | A long queue can point at oversharding or mapping churn, and also at slow master I/O or ILM churn. |

```
GET _cat/health?v
GET _cluster/health?level=indices
GET _health_report
GET _health_report/shards_availability
GET _cluster/pending_tasks
```

The indicators to name aloud: `master_is_stable`, `shards_availability`, `shards_capacity`, `disk`, `repository_integrity`, `ilm`, `slm`, `data_stream_lifecycle`. Map them to the stops as you go: shards to stop 1, ilm and data stream lifecycle to stop 2, disk to stop 3, repository, slm and master to stop 4.

Kibana screens: Dev Tools console. Optionally Stack Monitoring, Cluster overview, to show the same status as a dashboard.

## Stop 1: shards and memory (3 min)

Topic 1, shard strategy. Symptom: slow cluster state updates, heap pressure, slow restarts. Cause: many tiny shards, uneven sizes, hot spots.

Topic 2, heap, memory and JVM. Symptom: circuit breaker trips, GC pauses, nodes dropping. Cause: oversized heap, fielddata, heavy aggregations, too many shards per node.

| API | What it shows | What to say |
|---|---|---|
| `GET _cat/shards?v&s=store:desc&h=index,shard,prirep,state,docs,store,node` | Every shard, largest first | Look at the size spread. A long tail of tiny shards is oversharding. Target 10 to 50 GB per shard. |
| `GET _cat/indices?v&s=pri.store.size:desc` | Index sizes and primary counts | Spot indices with more primaries than their data justifies. |
| `GET _cluster/stats?filter_path=indices.count,indices.shards,nodes.count,nodes.jvm` | Totals for shards, indices, nodes, heap | Shards per node against the default limit. |
| `GET _cluster/settings?include_defaults=true&filter_path=*.cluster.max_shards_per_node` | The shard per node limit | Default is 1,000 per non-frozen data node, enforced cluster-wide, replicas included. A guard rail, not a target. Hitting it blocks anything that adds shards: create, restore, open, more replicas. Frozen nodes use `max_shards_per_node.frozen`, default 3,000. |
| `GET _cluster/allocation/explain` | Why the first unassigned shard is unassigned | Reads the allocation deciders in plain terms. |
| `POST _cluster/allocation/explain` with an index, shard and primary flag | The same for a chosen shard | Use when you know which shard you care about. |
| `GET _nodes/stats/jvm,breaker` | Heap, GC counts and times, breaker usage and trips | Rising old GC time and `tripped` counts are the warning signs. |
| `GET _cat/nodes?v&h=name,node.role,heap.percent,ram.percent,cpu,load_1m` | Heap and CPU per node | Compare nodes to find a hot one. |

```
GET _cat/shards?v&s=store:desc&h=index,shard,prirep,state,docs,store,node
GET _cluster/stats?filter_path=indices.count,indices.shards,nodes.count,nodes.jvm
GET _cluster/allocation/explain
GET _nodes/stats/jvm,breaker
GET _cat/nodes?v&h=name,node.role,heap.percent,ram.percent,cpu,load_1m
```

Heap guidance to say out loud: use automatic heap sizing. If you set heap by hand, stay at or below half of RAM and below the compressed oops threshold, roughly 26 to 30 GB, and check the startup log says `compressed ordinary object pointers [true]`. Elastic Cloud Hosted manages heap for you. More heap is not better. GC logs sit in the Elasticsearch log directory, or in the logs UI if logs are shipped.

Kibana screens:
- Stack Monitoring, Nodes, then a node's Advanced tab: JVM heap, GC count and duration over time.
- Stack Monitoring, Indices: shard counts and sizes per index.
- Stack Management, Index Management, Indices: shard and replica counts, store size, health.

## Stop 2: mappings and lifecycle (3 min)

Topic 3, mapping and field explosion. Symptom: mapping errors, rising heap, slow cluster state. Cause: unbounded dynamic mapping, high-cardinality keys, deep nesting.

Topic 4, data lifecycle and tiering. Symptom: storage cost grows at the hot-tier rate, ILM stuck. Cause: no rollover, wrong tier mix, ILM errors nobody watches.

| API | What it shows | What to say |
|---|---|---|
| `GET <index>/_mapping` | The mapping, field by field | Scroll to show how wide it is. |
| `GET _cluster/stats?filter_path=indices.mappings` | Total field count and field types across the cluster | Recent versions include `total_field_count`. A fast way to see the scale. |
| `GET <index>/_settings?include_defaults=true&filter_path=*.*.index.mapping.total_fields*` | The field limit in force, including the default | `index.mapping.total_fields.limit` defaults to 1,000. Show it, do not just raise it. |
| `GET *,.ds-*/_ilm/explain?only_errors=true` | Only the indices whose ILM step failed | The silent one. Shows the failed step and the error. It misses indices that are stuck without an error, such as a rollover that is never ready because of a bad alias, so also say that out loud and point at the `ilm` health indicator's stagnating-index diagnosis. |
| `GET <index>/_ilm/explain` | Phase, action and step for one index | Where in its life this index is. |
| `POST <index>/_ilm/retry` | Retries the failed step | Mention only, after fixing the cause. |
| `GET _ilm/policy/<policy>` | The policy definition | Rollover size and age, phase timings. |
| `GET _data_stream/<name>` and `GET _data_stream/_stats` | Backing indices, stored size per data stream | Which streams cost the most. |
| `GET <data_stream>/_lifecycle/explain` | Lifecycle state for data streams managed by data stream lifecycle | These do not appear in `_ilm/explain`. |
| `GET <index>/_settings?filter_path=*.settings.index.routing.allocation` | The tier preference of an index | Shows which tier it lives on. |

```
GET <index>/_mapping
GET _cluster/stats?filter_path=indices.mappings
GET <index>/_settings?include_defaults=true&filter_path=*.*.index.mapping.total_fields*
GET *,.ds-*/_ilm/explain?only_errors=true
GET _ilm/policy/<policy>
GET _data_stream/_stats
```

Mapping advice: use explicit mappings or the `flattened` field type for unbounded keys, and set the field limit deliberately. Lifecycle advice: roll over on size, not only age, and alert on `ilm` and `data_stream_lifecycle` health indicators.

Kibana screens:
- Stack Management, Index Lifecycle Policies: the policy phases, and the count of indices managed by each. Open one policy to show the hot, warm, cold and frozen phases.
- Stack Management, Index Management, Data Streams: backing indices, lifecycle, storage size.
- Stack Management, Index Management, Indices, an index, Mappings tab: the same mapping in a tree view.
- Appendix slide on data tiering if the room wants the cost picture.

## Stop 3: capacity and ingest (3 min)

Topic 5, capacity and disk watermarks. Symptom: indices go read-only, unassigned shards. Cause: no retention-driven sizing, no headroom for merges and recovery.

Topic 6, ingest backpressure. Symptom: 429 responses, indexing lag, client retries. Cause: bulk sizing, expensive pipelines, refresh interval, write thread pool saturation.

| API | What it shows | What to say |
|---|---|---|
| `GET _cat/allocation?v` | Disk used, disk available and shard count per node | Uneven disk is the first thing to look for. |
| `GET _cluster/settings?include_defaults=true&filter_path=*.cluster.routing.allocation.disk*` | The watermark settings | Low 85%, high 90%, flood stage 95% by default. Since 8.5 each also has a `max_headroom` cap (200, 150 and 100 GB) that applies to percentage watermarks, so on large disks a node trips later than 85%. |
| `GET */_settings?expand_wildcards=all&filter_path=*.settings.index.blocks` | Indices carrying a read-only block | What flood stage does. After freeing space, recent versions release the block automatically. |
| `GET _cat/thread_pool/write?v&h=node_name,name,active,queue,queue_size,rejected` | Write pool activity and rejections | A rising `rejected` is the 429s the client sees. |
| `GET _nodes/stats/thread_pool?filter_path=nodes.*.name,nodes.*.thread_pool.write` | The same from node stats | For scripts and dashboards. |
| `GET _nodes/stats/indexing_pressure` | Memory held by in-flight indexing requests | Coordinating, primary and replica pressure, and rejection counts. |
| `GET <index>/_settings?include_defaults=true&filter_path=*.*.index.refresh_interval` | The refresh interval | A longer interval reduces indexing cost for heavy ingest. |

```
GET _cat/allocation?v
GET _cluster/settings?include_defaults=true&filter_path=*.cluster.routing.allocation.disk*
GET */_settings?expand_wildcards=all&filter_path=*.settings.index.blocks
GET _cat/thread_pool/write?v&h=node_name,name,active,queue,queue_size,rejected
GET _nodes/stats/indexing_pressure
```

Ingest advice: bulk requests of a few MB to tens of MB, lengthen `refresh_interval` during heavy loads, move expensive processing out of ingest pipelines before adding nodes, and tie back to the earlier point that indexing is only as fast as the slowest shard.

Capacity advice: size from retention and daily volume, and leave headroom for merges and for recovery after a node loss. The watermarks are the safety net, not the plan.

Kibana screens:
- Stack Monitoring, Nodes: disk free space, indexing rate and latency per node.
- Stack Monitoring, Indices: indexing rate and search rate per index.
- Stack Management, Index Management: the read-only state shows in the index settings.

## Stop 4: queries and recovery (3 min)

Topic 7, query performance. Symptom: slow dashboards, search rejections. Cause: wildcard and leading-wildcard queries, deep pagination, high-cardinality aggregations, no slow log.

Topic 8, resilience and recovery. Symptom: long outages, failed restores. Cause: no dedicated masters at scale, no zone awareness, snapshots never test-restored.

| API | What it shows | What to say |
|---|---|---|
| `PUT <index>/_settings` with `index.search.slowlog.threshold.query.warn` and `.fetch.warn` | Turns on the search slow log | Enable it before you need it. Pick thresholds that match your service levels. Output goes to a separate `*_index_search_slowlog.json` file in the log directory. On Elastic Cloud Hosted you only see it if logs ship to a monitoring deployment, so show it there. |
| `GET _tasks?actions=*search&detailed=true` | Running search tasks with their query | Find the one query holding a node down. Only shows something while a slow search is running, so start the prepared slow query from a second tab first. |
| `POST _tasks/<task_id>/_cancel` | Cancels a task | Mention only. |
| `POST <index>/_search` with `"profile": true` | Time spent in each query component and shard | Shows why a query is slow: which clause, which collector. Profile the same slow query, because `match_all` gives a trivial tree. |
| `GET _cat/thread_pool/search?v` | Search pool queue and rejections | Search rejections are the symptom on dashboards. |
| `GET _cat/nodes?v&h=name,node.role,master` and `GET _cat/master?v` | Roles and the elected master | Are masters dedicated, and how many. |
| `GET _cluster/settings?include_defaults=true&filter_path=*.cluster.routing.allocation.awareness*` and `GET _nodes/settings?filter_path=nodes.*.settings.cluster.routing.allocation.awareness` | Zone awareness settings | Whether replicas are forced into other zones. Awareness is often set in elasticsearch.yml, so the node settings call is the reliable one. An empty `{}` from the cluster call does not mean no awareness. |
| `GET _nodes?filter_path=nodes.*.name,nodes.*.attributes` | Node attributes such as zone | Confirms the zones are set. |
| `GET _snapshot/_all` and `GET _slm/policy` | Repositories and snapshot policies | What is configured. |
| `POST _snapshot/<repo>/_verify` | Checks every node can reach the repository | Cheap sanity check. |
| `POST _snapshot/<repo>/<snapshot>/_restore` with a rename | Restores to a new index name | The drill. A snapshot never test-restored is a hope, not a backup. |

```
GET _tasks?actions=*search&detailed=true
GET <index>/_search
{ "profile": true, "query": { "wildcard": { "<keyword_field>": "*<term>*" } } }
GET _cat/nodes?v&h=name,node.role,master
GET _cluster/settings?include_defaults=true&filter_path=*.cluster.routing.allocation.awareness*
GET _nodes/settings?filter_path=nodes.*.settings.cluster.routing.allocation.awareness
GET _snapshot/_all
POST _snapshot/<repo>/<snapshot>/_restore
{ "indices": "<index>", "rename_pattern": "(.+)", "rename_replacement": "restored_$1" }
```

Resilience advice: three dedicated master nodes across three zones at scale, shard allocation awareness on the zone attribute, and a restore drill on a schedule, at least quarterly. Say what the drill proves: the snapshot is complete, the permissions work, and you know how long a restore takes.

Kibana screens:
- Dev Tools, Search Profiler: paste a query and see the profile as a visual breakdown. The friendliest way to show the profile API.
- Stack Management, Snapshot and Restore: the Snapshots, Repositories, Policies and Restore Status tabs. Open a snapshot, choose Restore, restore to a renamed index, then watch Restore Status.
- Stack Monitoring, Nodes: search rate and latency.
- Appendix slide with the reference architecture if the room asks about the monitoring cluster, zones or dedicated masters.

## Kibana screens at a glance

| Screen | Where | Used in |
|---|---|---|
| Dev Tools console | Dev Tools, Console | All stops |
| Search Profiler | Dev Tools, Search Profiler | Stop 4 |
| Stack Monitoring | Stack Monitoring, Cluster overview, Nodes, Indices | Stops 0, 1, 3, 4 |
| Index Management | Stack Management, Index Management, Indices and Data Streams | Stops 1, 2, 3 |
| Index Lifecycle Policies | Stack Management, Index Lifecycle Policies | Stop 2 |
| Snapshot and Restore | Stack Management, Snapshot and Restore | Stop 4 |

Menu names move between Kibana versions. Check the paths in your version during pre-flight.

## Alerting to suggest at the close

The close slide asks for early alerts. The concrete list, each one backed by a call above:

- `_health_report` status, and the `disk` and `ilm` indicators in particular
- Disk used per node before the low watermark
- Write and search thread pool `rejected` counters rising
- ILM errors from `_ilm/explain?only_errors=true`
- Snapshot policy failures from SLM, and the age of the last good snapshot
- Heap used percent and old GC time on data nodes

## After the demo

Reverse anything you changed: delete the restore target index, remove or reset the slow log settings, and clear any test data. If you raised a field limit or retried an ILM step, put it back, so the next run starts from the same state.
