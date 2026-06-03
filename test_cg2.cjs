async function test() {
  const res = await fetch('https://sdk.crazygames.com/crazygames-sdk-v3.js');
  const text = await res.text();
  console.log([...text.matchAll(/([a-zA-Z0-9_]+)InviteButton/gi)].map(m => m[0]));
  console.log([...text.matchAll(/([a-zA-Z0-9_]+)Room/gi)].map(m => m[0]));
  console.log([...text.matchAll(/([a-zA-Z0-9_]+)JoinListener/gi)].map(m => m[0]));
  console.log([...text.matchAll(/([a-zA-Z0-9_]+)multiplayer([a-zA-Z0-9_]*)/gi)].map(m => m[0]));
}
test();
