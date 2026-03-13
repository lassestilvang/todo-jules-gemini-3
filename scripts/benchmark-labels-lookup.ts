import { performance } from 'perf_hooks';

interface Label {
    id: number;
    name: string;
    color: string | null;
}

function runBenchmark(numLabels: number, numAssigned: number, iterations: number) {
    const labels: Label[] = Array.from({ length: numLabels }, (_, i) => ({
        id: i,
        name: `Label ${i}`,
        color: '#000'
    }));

    const assignedLabels: Label[] = labels.slice(0, numAssigned);

    console.log(`Benchmarking with ${numLabels} total labels and ${numAssigned} assigned labels (${iterations} iterations)`);

    // Baseline
    const startBaseline = performance.now();
    for (let i = 0; i < iterations; i++) {
        const labelId = Math.floor(Math.random() * numLabels);
        const isAssigned = assignedLabels.some(l => l.id === labelId);
        if (isAssigned) {
            assignedLabels.filter(l => l.id !== labelId);
        } else {
            labels.find(l => l.id === labelId);
        }
    }
    const endBaseline = performance.now();
    console.log(`Baseline (linear search): ${(endBaseline - startBaseline).toFixed(4)}ms`);

    // Optimized
    const startOptimized = performance.now();
    for (let i = 0; i < iterations; i++) {
        const labelsMap = new Map(labels.map(l => [l.id, l]));
        const assignedLabelIds = new Set(assignedLabels.map(l => l.id));

        const labelId = Math.floor(Math.random() * numLabels);
        const isAssigned = assignedLabelIds.has(labelId);
        if (isAssigned) {
            // In the real code, we use setAssignedLabels(prev => prev.filter(...))
            // The filter is still O(n), but the check and find are O(1)
            assignedLabels.filter(l => l.id !== labelId);
        } else {
            labelsMap.get(labelId);
        }
    }
    const endOptimized = performance.now();
    console.log(`Optimized (Set/Map - including creation): ${(endOptimized - startOptimized).toFixed(4)}ms`);

    // Optimized with pre-created Map/Set (simulating useMemo)
    const startOptimizedPre = performance.now();
    const labelsMap = new Map(labels.map(l => [l.id, l]));
    const assignedLabelIds = new Set(assignedLabels.map(l => l.id));
    for (let i = 0; i < iterations; i++) {
        const labelId = Math.floor(Math.random() * numLabels);
        const isAssigned = assignedLabelIds.has(labelId);
        if (isAssigned) {
            assignedLabels.filter(l => l.id !== labelId);
        } else {
            labelsMap.get(labelId);
        }
    }
    const endOptimizedPre = performance.now();
    console.log(`Optimized (Set/Map - pre-created): ${(endOptimizedPre - startOptimizedPre).toFixed(4)}ms`);
}

console.log('--- Small data set ---');
runBenchmark(10, 3, 10000);

console.log('\n--- Medium data set ---');
runBenchmark(100, 20, 10000);

console.log('\n--- Large data set ---');
runBenchmark(1000, 100, 10000);
