export async function etaCompatibility(ctx) {
  console.log("ETA compat function called!");

  // Poll until mod.api.ETA exists
  const etaApi = await new Promise((resolve) => {
    const interval = setInterval(() => {
        console.log("ETA not found yet...N")
      if (mod.api.ETA) {
        clearInterval(interval);
        resolve(mod.api.ETA);
      }
    }, 50); // check every 50ms
  });

  console.log("ETA API found:", etaApi);

}
