// Workshop: cluster operations and administration. 30 minutes, demo heavy.
//
//   Tell 1 (about 11 min): hero, agenda, the four data operations (kept brief),
//                          the node roles that do the work, then the eight areas by symptom.
//   Show   (about 15 min): live in Kibana. Health first, then four stops, two topics per stop.
//   Tell 2 (about 4 min):  the operating habits to take away.
//   Appendix (not timed):  the health APIs, topics 1 to 4 reference, the data tiering visual,
//                          topics 5 to 8 reference, then the reference architecture with its
//                          monitoring cluster. Skipped in the room, used for questions and the handout.
//
// Scene formats are mixed on purpose: cards (data operations), the node role diagram,
// tabs (areas), the demo grid, then reference grids broken up by the data tiering
// animation and the architecture diagram. All are existing scenes.
//
// The data operations slide condenses the "Data Operations" request lifecycle deck
// (index, delete, update, search). The demo stops cover the eight topics:
//   1 shard strategy      2 heap, memory, JVM     3 mapping and field explosion
//   4 lifecycle, tiering  5 capacity, watermarks  6 ingest backpressure
//   7 query performance   8 resilience, recovery
//
// The scenes are the generic layout templates; this file supplies their content and
// speaker notes. Applying the preset seeds them (see applyPreset in SceneSettings).
// No em dashes: src/utils/noEmDash.test.js keeps new files clean.

export const CLUSTER_OPS_PRESET = {
  id: 'cluster-ops-workshop',
  label: 'Workshop: Cluster Operations',
  description:
    'A 30 minute cluster operations and administration workshop. A short look at how the four data operations use resources and which node roles do the work, the eight areas where clusters hurt, then live Kibana demos starting with the health APIs. The appendix has the health APIs, a reference for all eight topics, data tiering and the reference architecture.',
  sceneIds: [
    'hero',
    'agenda',
    'business-value',
    'node-types',
    'problem-patterns',
    'value-by-team',
    'platform-value',
    // Appendix, after the close on purpose. 'value-by-team~2' and '~3' are copies of the
    // demo layout, created when the preset is applied (see `duplicates` below).
    'elastic-value',
    'value-by-team~2',
    'data-tiering',
    'value-by-team~3',
    'enterprise-deployment',
  ],
  duplicates: [
    { id: 'value-by-team~2', sourceId: 'value-by-team', label: 'Appendix B: Reference, topics 1 to 4' },
    { id: 'value-by-team~3', sourceId: 'value-by-team', label: 'Appendix C: Reference, topics 5 to 8' },
  ],
  durations: {
    hero: '1 min',
    agenda: '1 min',
    'business-value': '3 min',
    'node-types': '3 min',
    'problem-patterns': '3 min',
    'value-by-team': '15 min',
    'platform-value': '4 min',
    'elastic-value': '0 min',
    'value-by-team~2': '0 min',
    'data-tiering': '0 min',
    'value-by-team~3': '0 min',
    'enterprise-deployment': '0 min',
  },
  sceneMetadata: {
    hero: {
      align: 'left',
      typingText: 'Operate the cluster before it pages you',
      bannerTitle: 'Cluster operations and administration:',
      bannerHighlight: 'find the cause, not just the symptom',
      bannerSubtitle: 'Eight problem areas, each with a diagnostic you can run today',
      speakerNotes: [
        'TELL, 1 min.',
        'Frame: most cluster incidents trace back to a small set of causes. Each one has a symptom, a cause and a diagnostic.',
        'This is a working session. About 15 of the 30 minutes are live in Kibana, so ask questions as we go.',
      ].join('\n'),
    },
    agenda: {
      eyebrow: 'What we will cover',
      subtitle: '30 minutes, demos live in Kibana, for self-managed and Elastic Cloud Hosted',
      items: [
        { time: '11 min', title: 'How data operations use resources, which nodes do the work, and the eight areas where clusters hurt', sceneIds: [] },
        { time: '15 min', title: 'Live demo: cluster health first, then four stops through the diagnostics', sceneIds: [] },
        { time: '4 min', title: 'Operating habits to take away', sceneIds: [] },
      ],
      speakerNotes: [
        'TELL, 1 min. Roadmap for the room.',
        'Scope: self-managed and Elastic Cloud Hosted. Serverless has no node-level APIs, so most of the diagnostics here do not apply to it.',
        'Block one is short on purpose. Block two is where we spend the time. Appendix slides after the close hold the detail for questions.',
        'Ask who owns capacity, who owns ingest and who owns restores today. It shapes which demo stop to linger on.',
      ].join('\n'),
    },
    'business-value': {
      eyebrow: 'Data operations',
      title: 'Four operations,',
      titleHighlight: 'four resource bills',
      subtitle: 'Every use case relies on all four, at different levels. Each one costs something different.',
      cards: [
        {
          icon: 'database',
          title: 'Index',
          description: 'CPU, then disk',
          detailText:
            'Parse, run the ingest pipeline, analyse text, buffer, then flush to a segment and replicate. Indexing is only as fast as the slowest shard.',
        },
        {
          icon: 'clock',
          title: 'Delete',
          description: 'Marks, does not free',
          detailText:
            'A delete marks the document. Segment files are immutable, so space comes back only at the next segment merge.',
        },
        {
          icon: 'right-left',
          title: 'Update',
          description: 'Delete plus index',
          detailText:
            'Documents are immutable. An update marks the old one deleted and indexes a new one at the Lucene shard level.',
        },
        {
          icon: 'magnifying-glass',
          title: 'Search',
          description: 'Scatter and gather',
          detailText:
            'The coordinating node routes to every relevant shard, each searches its segments, and the results are merged. Memory and disk reads dominate.',
        },
      ],
      summaryText: 'More shards means more work per operation. That is where the next slide starts.',
      speakerNotes: [
        'TELL, 3 min. Keep this to the four verbs. Do not walk the full request diagrams.',
        'Index: coordinating node routes to the primary, which replicates. The request returns when every in-sync copy has indexed the operation and written it to the translog. One slow shard slows the whole bulk.',
        'Delete: tombstone only. Disk does not shrink until a merge. Worth knowing before someone deletes by query to free space.',
        'Update: delete plus index. Heavy updates cost like heavy indexing.',
        'Search: scatter to shards, gather and merge. Every extra shard adds work to every query.',
        'Bridge: next slide shows which node roles do this work.',
      ].join('\n'),
    },
    'node-types': {
      title: 'Node roles',
      eyebrow: 'Where the work happens',
      titlePlain: 'Node roles: ',
      titleAccent: 'who does the work',
      subtitle: 'Each data operation lands on a different role. The diagnostics later point at them.',
      nodes: [
        { description: 'Hold cluster state: mappings, settings, shard routing. Oversharding and mapping explosions slow them down. At scale, use three dedicated masters across zones.' },
        { description: 'Hold shards and run indexing and search. Heap, disk and thread pools live here, so most diagnostics in this session point at these nodes.' },
        { description: 'Run pipelines before indexing. When roles are combined, heavy processors compete with indexing for CPU, and are a common cause of 429s.' },
        { description: 'Route requests, scatter to shards and merge results. Deep pagination and large aggregations cost memory here.' },
        { description: 'Run anomaly detection and inference. Keep them off the data nodes so jobs do not steal resources from indexing and search.' },
      ],
      callout: 'Small clusters combine roles. At scale, separate them so one bad workload cannot take the cluster down.',
      speakerNotes: [
        'TELL, 3 min. Tie the four verbs to the node that does the work.',
        'Index: the coordinating node routes to the primary shard on a data node, which replicates. If a pipeline is used, the ingest role runs it first.',
        'Search: the coordinating node scatters to shards on data nodes, then gathers and merges.',
        'Masters hold cluster state. Every shard and every mapped field adds to it, which is why oversharding and mapping explosions show up as slow cluster state updates.',
        'Ask: do you run dedicated masters today? Roles can be combined on small clusters, but at scale separate them.',
        'Bridge: the next slide lists where this goes wrong.',
      ].join('\n'),
    },
    'problem-patterns': {
      eyebrow: 'Where clusters hurt',
      title: 'Eight areas,',
      titleHighlight: 'three groups',
      subtitle: 'Each one shows up as a symptom first. We will trace it to the cause in the demo.',
      categories: [
        {
          label: 'Shape and memory',
          icon: 'cubes',
          problems: [
            'Oversharding, uneven shards, hot spots',
            'Heap pressure, GC pauses, breaker trips',
            'Mapping and field explosion',
            'Slow cluster state updates',
          ],
        },
        {
          label: 'Data and capacity',
          icon: 'layer-group',
          problems: [
            'No rollover, ILM stuck on errors',
            'Disk watermarks, read-only indices',
            'Bulk 429s and indexing lag',
            'Hot-tier cost growing with data',
          ],
        },
        {
          label: 'Query and resilience',
          icon: 'life-ring',
          problems: [
            'Slow dashboards, search rejections',
            'Wildcards, deep paging, heavy aggs',
            'No dedicated masters or zone awareness',
            'Snapshots never test-restored',
          ],
        },
      ],
      speakerNotes: [
        'TELL, 3 min. Click through the three tabs, about one minute each, and name the numbered topics.',
        'Shape and memory (topics 1 to 3): oversharding, heap and JVM, mapping explosion. These share a cause: too much cluster state and too many small things.',
        'Data and capacity (topics 4 to 6): lifecycle and tiering, disk watermarks, ingest backpressure. These are about headroom and flow.',
        'Query and resilience (topics 7 and 8): slow queries, and surviving a bad day.',
        'Ask: which of these have you had an incident on in the last year? Use the answer to pick where to spend time in the demo.',
      ].join('\n'),
    },
    'value-by-team': {
      title: 'Live demo',
      eyebrow: 'Live demo',
      titlePlain: 'Health first, ',
      titleAccent: 'then eight diagnostics',
      subtitle: 'Kibana Dev Tools plus the management UI, on a lab cluster.',
      teams: [
        {
          id: 'health',
          title: 'Health first',
          tag: 'Start here',
          icon: 'life-ring',
          points: ['_cat/health, _cluster/health', '_health_report indicators', 'Unassigned and pending tasks'],
        },
        {
          id: 'shape',
          title: 'Shards and memory',
          tag: 'Topics 1 and 2',
          icon: 'cubes',
          points: ['_cat/shards, allocation/explain', 'JVM, GC and breaker stats', 'Stack Monitoring node view'],
        },
        {
          id: 'mapping',
          title: 'Mappings and lifecycle',
          tag: 'Topics 3 and 4',
          icon: 'layer-group',
          points: ['Field counts and field limit', '_ilm/explain, stuck steps', 'Data streams and tiers'],
        },
        {
          id: 'flow',
          title: 'Capacity and ingest',
          tag: 'Topics 5 and 6',
          icon: 'gauge-high',
          points: ['_cat/allocation, watermarks', 'Write thread pool, 429s', 'Indexing pressure stats'],
        },
        {
          id: 'recovery',
          title: 'Queries and recovery',
          tag: 'Topics 7 and 8',
          icon: 'file-shield',
          points: ['Slow log, _tasks, profile', 'Masters, zones, node loss', 'Snapshot restore drill'],
        },
      ],
      impactEyebrow: 'The point',
      impactStat: '1 call',
      impactLabel: 'to know where to look',
      impactDetail: 'Health first, then the diagnostic for the area it points at.',
      impactIcon: 'stopwatch',
      speakerNotes: [
        'SHOW, about 15 min, about 3 min per stop. Leave this slide up for 20 seconds, then switch to Kibana. Lab data, say so once.',
        'Stop 0, health first. GET _cat/health?v for one line: status, node count, shards, unassigned, pending tasks. GET _cluster/health?level=indices to see which indices are red or yellow. Then GET _health_report: each indicator gives a status, the impact, the cause and a diagnosis. Say the rule for cluster status, which covers shards only: green all shards assigned, yellow a replica is missing, red a primary is missing. The health report can be yellow for disk, ILM or snapshots while cluster status is green. Start every investigation here and let it pick the next stop. Detail is in Appendix A.',
        'Stop 1, shards and memory. _cat/shards?v&s=store:desc and _cluster/stats for the shard count and size spread. _cluster/allocation/explain on an unassigned or hot shard. Then _nodes/stats/jvm,breaker for heap, GC and breaker trips. Show the same in Stack Monitoring. Heap guidance: use automatic heap sizing; if set by hand, stay at or below half of RAM and below the compressed oops threshold (roughly 26 to 30 GB, check the startup log). Elastic Cloud Hosted manages heap for you.',
        'Stop 2, mappings and lifecycle. GET index/_mapping and compare field counts, or use _cluster/stats indices.mappings for the cluster-wide total. Show index.mapping.total_fields.limit. Then Index Lifecycle Policies in Stack Management and _ilm/explain for an index stuck in an error step. Show data stream stats and which tier holds what.',
        'Stop 3, capacity and ingest. _cat/allocation?v for disk per node, then the watermark settings (low, high, flood stage) and what flood stage does: read-only indices. Then _nodes/stats/thread_pool for write queue and rejections, and indexing pressure stats. Link back to the slowest shard point from slide three.',
        'Stop 4, queries and recovery. Search slow log settings, _tasks for a long-running search, and the profile API on one query. Then the resilience layout: dedicated masters, zone awareness, what happens when a node drops. Finish in Snapshot and Restore: show a policy and restore one snapshot to a new index name. A snapshot never test-restored is a hope, not a backup.',
        'If time is short, skip stop 2 mapping detail and keep the ILM explain call. Never skip stop 0.',
        'Pre-flight: have the Dev Tools console tabs saved ahead of time so no one watches you type URLs.',
      ].join('\n'),
    },
    'platform-value': {
      title: 'Take away',
      eyebrow: 'Operating habits',
      titlePlain: 'From firefighting to ',
      titleAccent: 'routine',
      subtitle: 'The same eight checks, run on a schedule instead of during an incident.',
      values: [
        {
          id: 'baseline',
          icon: 'chart-line',
          title: 'Baseline',
          desc: 'Record shard counts and sizes, heap, disk and thread pool rejections while healthy, so a bad day has something to compare to.',
        },
        {
          id: 'watch',
          icon: 'bell',
          title: 'Alert early',
          desc: 'Alert on ILM errors, disk before the low watermark, write rejections and health report status, before users notice.',
        },
        {
          id: 'rehearse',
          icon: 'life-ring',
          title: 'Rehearse',
          desc: 'Test-restore a snapshot, lose a node and a zone on purpose, and size for headroom to recover.',
        },
      ],
      closing: 'The ask: pick the two areas with the most incident history and schedule a cluster health review.',
      speakerNotes: [
        'TELL, 4 min. Close.',
        'Baseline: you cannot spot drift without a known good. Save the diagnostic calls as a runbook.',
        'Alert early: ILM errors and the low watermark are both silent until they are not.',
        'Rehearse: restores and failovers are where untested assumptions show up.',
        'AutoOps (Elastic Cloud Hosted, and self-managed through Cloud Connect) automates much of this monitoring and these diagnostics. Check availability for the customer version.',
        'Ask: choose the two areas with the most incidents and book a health review. Offer to run the same checks against their production cluster.',
      ].join('\n'),
    },
    // Appendix A: the health APIs in detail.
    'elastic-value': {
      title: 'Appendix A: Health APIs',
      eyebrow: 'Appendix A',
      titlePlain: 'Start with ',
      titleAccent: 'health',
      subtitle: 'Three calls, from a quick glance to the root cause. The report groups its checks into indicators.',
      heroStats: [
        { value: '_cat/health', icon: 'terminal', label: 'One line: status, nodes, shards, unassigned. Add the v parameter for headers.' },
        { value: '_cluster/health', icon: 'gauge-high', label: 'JSON for scripts, with wait_for_status. Add level=indices to find the red index. A long pending queue can point at oversharding.' },
        { value: '_health_report', icon: 'life-ring', label: 'Indicators with impact, cause and diagnosis. Set verbose=false for a quick pass.' },
      ],
      stats: [
        { value: 'shards', label: 'shards_availability, shards_capacity: unassigned shards, cluster-wide shard headroom' },
        { value: 'disk', label: 'disk: nodes near or past the watermarks' },
        { value: 'ilm', label: 'ilm, data_stream_lifecycle: stuck or erroring lifecycle' },
        { value: 'snapshots', label: 'repository_integrity, slm: repository readable, policies running' },
      ],
      bottomLineEyebrow: 'Reading it',
      bottomLine: 'Cluster status covers shards only: green all assigned, yellow a replica missing, red a primary missing. The health report can be yellow for disk, ILM or snapshots while cluster status is green.',
      bottomLineIcon: 'bullseye',
      speakerNotes: [
        'APPENDIX A. Use for questions, not in the timed run.',
        '_cat/health is the glance. _cluster/health returns JSON and lets scripts block with wait_for_status. level=indices or level=shards narrows down the red or yellow part. A long pending_tasks queue (_cluster/pending_tasks) can point at oversharding or mapping churn, and also at slow master I/O or ILM churn.',
        '_health_report is the one to teach. Each indicator returns a status, a symptom, the impact on users, and a diagnosis with a suggested action. Use it first in an incident.',
        'Other indicators: master_is_stable, plus the seven on the slide (grouped in four rows). Recent versions add file_settings. Map them to topics: shards_availability and shards_capacity to topic 1, disk to topic 5, ilm and data_stream_lifecycle to topic 4, repository_integrity, slm and master_is_stable to topic 8.',
        'Alerting: alert on the report status and on the disk and ilm indicators, not only on cluster status.',
      ].join('\n'),
    },
    // Appendix B and C: a symptom, cause and call reference for the eight topics.
    'value-by-team~2': {
      title: 'Appendix B: Reference 1 to 4',
      eyebrow: 'Appendix B',
      titlePlain: 'Reference: ',
      titleAccent: 'topics 1 to 4',
      subtitle: 'Symptom, cause, then the call to run.',
      teams: [
        {
          id: 'shards',
          title: 'Shard strategy',
          tag: 'Shape and memory',
          icon: 'cubes',
          points: ['Slow state updates, heap pressure', 'Many tiny shards, hot spots', 'Run: _cat/shards, allocation/explain'],
        },
        {
          id: 'heap',
          title: 'Heap, memory, JVM',
          tag: 'Shape and memory',
          icon: 'server',
          points: ['Breaker trips, GC pauses, node drops', 'Heap set too high, fielddata, big aggs', 'Run: _nodes/stats/jvm,breaker'],
        },
        {
          id: 'mapping',
          title: 'Mapping explosion',
          tag: 'Shape and memory',
          icon: 'diagram-project',
          points: ['Mapping errors, rising heap', 'Unbounded dynamic keys, deep nesting', 'Run: _mapping, total_fields.limit'],
        },
        {
          id: 'lifecycle',
          title: 'Lifecycle and tiering',
          tag: 'Data and capacity',
          icon: 'layer-group',
          points: ['Storage cost climbs, ILM stuck', 'No rollover, wrong tier mix', 'Run: _ilm/explain, data stream stats'],
        },
      ],
      impactEyebrow: 'Rule of thumb',
      impactStat: '10 to 50 GB',
      impactLabel: 'target size per shard',
      impactDetail: 'A guard rail, not a target: 1,000 per non-frozen data node, cluster-wide, replicas included.',
      impactIcon: 'cubes',
      speakerNotes: [
        'APPENDIX B. Reference for topics 1 to 4. Not in the timed run.',
        'Each card is symptom, then cause, then the call to run.',
        'Heap: use automatic heap sizing. If set by hand, stay at or below half of RAM and below the compressed oops threshold, roughly 26 to 30 GB; the startup log should say compressed ordinary object pointers [true]. More heap is not better.',
        'Shards: cluster.max_shards_per_node is enforced as the limit times the number of non-frozen data nodes, counts replicas, and blocks anything that adds shards (create, restore, open, more replicas). Frozen nodes use max_shards_per_node.frozen, default 3000.',
        'Mapping: set index.mapping.total_fields.limit deliberately and use flattened or explicit mappings for unbounded keys.',
        'Lifecycle: ILM errors are silent until storage fills. Check _ilm/explain on a schedule.',
      ].join('\n'),
    },
    'value-by-team~3': {
      title: 'Appendix C: Reference 5 to 8',
      eyebrow: 'Appendix C',
      titlePlain: 'Reference: ',
      titleAccent: 'topics 5 to 8',
      subtitle: 'Symptom, cause, then the call to run.',
      teams: [
        {
          id: 'capacity',
          title: 'Capacity, watermarks',
          tag: 'Data and capacity',
          icon: 'database',
          points: ['Read-only indices, unassigned shards', 'No headroom for merges, recovery', 'Run: _cat/allocation, watermarks'],
        },
        {
          id: 'ingest',
          title: 'Ingest backpressure',
          tag: 'Data and capacity',
          icon: 'bolt',
          points: ['429s, indexing lag, retries', 'Bulk size, heavy pipelines, refresh', 'Run: thread_pool, indexing_pressure'],
        },
        {
          id: 'query',
          title: 'Query performance',
          tag: 'Query and resilience',
          icon: 'magnifying-glass',
          points: ['Slow dashboards, rejections', 'Leading wildcards, deep paging, aggs', 'Run: slow log, _tasks, profile'],
        },
        {
          id: 'resilience',
          title: 'Resilience, recovery',
          tag: 'Query and resilience',
          icon: 'life-ring',
          points: ['Long outages, failed restores', 'No masters, no zones, untested snaps', 'Run: _health_report, restore drill'],
        },
      ],
      impactEyebrow: 'Default watermarks',
      impactStat: '85/90/95%',
      impactLabel: 'low, high and flood stage',
      impactDetail: 'Flood stage makes indices read-only. From 8.5, max_headroom caps (200/150/100 GB) apply on large disks.',
      impactIcon: 'gauge-high',
      speakerNotes: [
        'APPENDIX C. Reference for topics 5 to 8. Not in the timed run.',
        'Watermarks: on large disks, 8.5 and later also apply max_headroom (low 200 GB, high 150 GB, flood stage 100 GB) when the watermark is a percentage, so a node trips later than 85%. Low stops new shards landing on the node, high moves shards off, flood stage sets indices read-only. After freeing space, newer versions release the block automatically.',
        'Ingest: raise bulk size to a few MB to tens of MB, lengthen refresh_interval, and move heavy work out of ingest pipelines before adding nodes.',
        'Query: enable the slow log with sensible thresholds before you need it. For deep paging, the limit is index.max_result_window (10,000); use search_after with a point in time instead.',
        'Resilience: three dedicated masters across zones at scale, shard allocation awareness, and a restore drill at least quarterly.',
      ].join('\n'),
    },
    // Appendix visuals: existing scenes with their default content, plus speaker notes.
    'data-tiering': {
      title: 'Appendix: Data tiering',
      speakerNotes: [
        'APPENDIX, topic 4. Not in the timed run.',
        'Use for lifecycle and cost questions. Hot, warm, cold and frozen differ in cost per GB and in how fast they answer.',
        'Tie back to the demo: ILM moves data between tiers, and _ilm/explain shows where a stuck index is. Without rollover and a tier plan, everything stays at the hot-tier cost per GB.',
      ].join('\n'),
    },
    'enterprise-deployment': {
      title: 'Appendix: Reference architecture',
      speakerNotes: [
        'APPENDIX, topics 5 to 8. Not in the timed run.',
        'Use for resilience and capacity questions. Point at the tiered cluster, the dedicated master nodes and the separate monitoring cluster.',
        'The monitoring cluster is why Stack Monitoring still works when production is unhealthy. Ask if they have one.',
        'Zone awareness, dedicated masters and snapshot repositories on this diagram are the answers to topic 8.',
      ].join('\n'),
    },
  },
}
