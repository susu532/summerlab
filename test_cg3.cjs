async function test() {
  const res = await fetch('https://sdk.crazygames.com/crazygames-sdk-v3.js');
  const text = await res.text();
  console.log([...text.matchAll(/.{0,20}\.game\.{0,20}/g)].map(m => m[0]));
}
test();
