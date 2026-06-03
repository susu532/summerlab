async function test() {
  const res = await fetch('https://sdk.crazygames.com/crazygames-sdk-v3.js');
  const text = await res.text();
  console.log("length:", text.length);
  const re = /([a-zA-Z0-9_]+\.showInviteButton)/g;
  console.log([...text.matchAll(re)].map(m => m[1]));
  
  const re2 = /([a-zA-Z0-9_]+\.updateRoom)/g;
  console.log([...text.matchAll(re2)].map(m => m[1]));

  const re3 = /([a-zA-Z0-9_]+\.setRoomJoinListener)/g;
  console.log([...text.matchAll(re3)].map(m => m[1]));
  
  const re4 = /([a-zA-Z0-9_]+\.game)/g;
  const matches = [...text.matchAll(re4)].map(m => m[1]);
  console.log([...new Set(matches)]);
}

test();
