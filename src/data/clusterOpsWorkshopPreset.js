// Workshop: cluster operations and administration. 30 minutes, demo heavy.
//
//   Tell 1 (about 10 min): hero, agenda, the four data operations (kept brief),
//                          then the eight areas by symptom.
//   Show   (about 16 min): four live stops in Kibana, two topics per stop.
//   Tell 2 (about 4 min):  the operating habits to take away.
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
    'A 30 minute cluster operations and administration workshop. A short look at how the four data operations use resources, the eight areas where clusters hurt, then four live Kibana demo stops.',
  sceneIds: [
    'hero',
    'agenda',
    'business-value',
    'problem-patterns',
    'value-by-team',
    'platform-value',
  ],
  durations: {
    hero: '1 min',
    agenda: '1 min',
    'business-value': '4 min',
    'problem-patterns': '4 min',
    'value-by-team': '16 min',
    'platform-value': '4 min',
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
        'This is a working session. About 16 of the 30 minutes are live in Kibana, so ask questions as we go.',
      ].join('\n'),
    },
    agenda: {
      eyebrow: 'What we will cover',
      subtitle: '30 minutes, with the demos live in Kibana',
      items: [
        { time: '8 min', title: 'How data operations use resources, and the eight areas where clusters hurt', sceneIds: [] },
        { time: '16 min', title: 'Live demo: four stops through the diagnostics, two topics per stop', sceneIds: [] },
        { time: '4 min', title: 'Operating habits to take away', sceneIds: [] },
      ],
      speakerNotes: [
        'TELL, 1 min. Roadmap for the room.',
        'Block one is short on purpose. Block two is where we spend the time.',
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
            'Documents are immutable. An update marks the old one deleted and indexes a new one at the Lucene shard level, without the ingest pipeline.',
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
        'TELL, 4 min. Keep this to the four verbs. Do not walk the full request diagrams.',
        'Index: coordinating node routes to the primary, which replicates. The request returns when every in-sync copy commits. One slow shard slows the whole bulk.',
        'Delete: tombstone only. Disk does not shrink until a merge. Worth knowing before someone deletes by query to free space.',
        'Update: delete plus index. Heavy updates cost like heavy indexing.',
        'Search: scatter to shards, gather and merge. Every extra shard adds work to every query.',
        'Bridge: the eight areas that follow are all ways these four operations get expensive.',
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
            'Cost growing linearly with data',
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
        'TELL, 4 min. Click through the three tabs, about one minute each, and name the numbered topics.',
        'Shape and memory (topics 1 to 3): oversharding, heap and JVM, mapping explosion. These share a cause: too much cluster state and too many small things.',
        'Data and capacity (topics 4 to 6): lifecycle and tiering, disk watermarks, ingest backpressure. These are about headroom and flow.',
        'Query and resilience (topics 7 and 8): slow queries, and surviving a bad day.',
        'Ask: which of these have you had an incident on in the last year? Use the answer to pick where to spend time in the demo.',
      ].join('\n'),
    },
    'value-by-team': {
      title: 'Live demo',
      eyebrow: 'Live demo',
      titlePlain: 'Four stops, ',
      titleAccent: 'eight diagnostics',
      subtitle: 'Kibana Dev Tools plus the management UI, on a lab cluster.',
      teams: [
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
          icon: 'life-ring',
          points: ['Slow log, _tasks, profile', '_health_report', 'Snapshot restore drill'],
        },
      ],
      impactEyebrow: 'The point',
      impactStat: '8 checks',
      impactLabel: 'each a single API call',
      impactDetail: 'Symptom first, then the call that names the cause.',
      impactIcon: 'stopwatch',
      speakerNotes: [
        'SHOW, about 16 min, about 4 min per stop. Leave this slide up for 20 seconds, then switch to Kibana. Lab data, say so once.',
        'Stop 1, shards and memory. _cat/shards?v&s=store:desc and _cluster/stats for the shard count and size spread. _cluster/allocation/explain on an unassigned or hot shard. Then _nodes/stats/jvm,breaker for heap, GC and breaker trips. Show the same in Stack Monitoring. Point out heap past about 31 GB loses compressed oops.',
        'Stop 2, mappings and lifecycle. GET index/_mapping and count fields by index. Show index.mapping.total_fields.limit. Then Index Lifecycle Policies in Stack Management and _ilm/explain for an index stuck in an error step. Show data stream stats and which tier holds what.',
        'Stop 3, capacity and ingest. _cat/allocation?v for disk per node, then the watermark settings (low, high, flood stage) and what flood stage does: read-only indices. Then _nodes/stats/thread_pool for write queue and rejections, and indexing pressure stats. Link back to the slowest shard point from slide three.',
        'Stop 4, queries and recovery. Search slow log settings, _tasks for a long-running search, and the profile API on one query. Then GET _health_report. Finish in Snapshot and Restore: show a policy and restore one snapshot to a new index name. A snapshot never test-restored is a hope, not a backup.',
        'If time is short, skip stop 2 mapping detail and keep the ILM explain call.',
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
        'Ask: choose the two areas with the most incidents and book a health review. Offer to run the same checks against their production cluster.',
      ].join('\n'),
    },
  },
}
