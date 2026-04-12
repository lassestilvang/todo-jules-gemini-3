import { setTimeout as delay } from 'timers/promises';

async function reproduce(optimized = false) {
  console.log(`\n--- Testing ${optimized ? 'OPTIMIZED' : 'BASELINE'} implementation ---`);

  let query = '';
  let open = false;
  let results: any[] = [];
  let apiCalls = 0;
  let cleanupCalled = 0;
  let timer: NodeJS.Timeout | null = null;
  let isCancelled = false;

  const mockSearchTasks = async (q: string) => {
    apiCalls++;
    await delay(100); // Simulate network delay
    return [{ id: 1, name: `Task for ${q}` }];
  };

  const setResults = (data: any[]) => {
    results = data;
    // console.log(`Results set to:`, data);
  };

  // Simulate useEffect
  const runEffect = (newQuery: string, newOpen: boolean) => {
    // Simulate cleanup from previous effect
    if (timer || isCancelled) {
       // console.log("Cleaning up previous effect");
       isCancelled = true;
       if (timer) clearTimeout(timer);
       cleanupCalled++;
    }

    query = newQuery;
    open = newOpen;
    isCancelled = false;

    // Simulation of the implementation in search-command.tsx
    const effectLogic = () => {
        // Optimized check
        if (optimized && !open) {
             if (query.length === 0) {
                setResults([]);
             }
             return () => {
                isCancelled = true;
                if (timer) clearTimeout(timer);
             };
        }

        if (query.length === 0) {
            setResults([]);
            return () => {
                isCancelled = true;
                if (timer) clearTimeout(timer);
            };
        }

        timer = setTimeout(async () => {
            const data = await mockSearchTasks(query);
            if (!isCancelled) {
                setResults(data);
            }
        }, 300);

        return () => {
            isCancelled = true;
            if (timer) clearTimeout(timer);
        };
    };

    return effectLogic();
  };

  console.log("1. User opens dialog and types 'abc'");
  let cleanup = runEffect('abc', true);

  await delay(100);
  console.log("2. User closes dialog before debounce finishes");

  // In BASELINE, useEffect only depends on [query].
  // Changing 'open' won't trigger the effect/cleanup.
  if (!optimized) {
      open = false;
      // runEffect is NOT called because dependencies [query] didn't change
  } else {
      // In OPTIMIZED, useEffect depends on [query, open]
      cleanup(); // React calls cleanup
      cleanup = runEffect('abc', false);
  }

  await delay(500); // Wait for potential debounce and API call

  console.log(`API Calls made: ${apiCalls}`);
  if (apiCalls > 0 && !open) {
      console.log("❌ FAILURE: API call made while dialog was closed!");
  } else if (apiCalls === 0 && !open) {
      console.log("✅ SUCCESS: No unnecessary API calls made.");
  }

  // Cleanup final effect
  cleanup();
}

async function main() {
  await reproduce(false);
  await reproduce(true);
}

main().catch(console.error);
