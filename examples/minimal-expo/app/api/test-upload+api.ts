export const POST = async (req: Request) => {
  //   console.log(
  //     ">>> POST ENDPOINT",
  //     Object.fromEntries((await req.formData()).entries()),
  //   );
  const blob = await req.blob();
  console.log(">> POST ENDPOINT", { blobSize: blob.size });
  console.log(">> POST ENDPOINT", blob);
  return new Response("OKKKKK");
};
