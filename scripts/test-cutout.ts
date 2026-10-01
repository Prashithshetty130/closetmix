import sharp from 'sharp';

async function analyze(file: string) {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  let solid = 0, transparent = 0, semi = 0;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i+3];
    if (a === 255) solid++;
    else if (a === 0) transparent++;
    else semi++;
  }
  console.log(file, { width: info.width, height: info.height, solid, transparent, semi, total: info.width*info.height });
}

async function main() {
  await analyze('public/uploads/5df1b9d0-cc78-4d14-a006-9230ded9d808/items/075dc57c-fd4e-4547-a6bc-12b6de2280f6/cutout_075dc57c-fd4e-4547-a6bc-12b6de2280f6.png');
  await analyze('public/uploads/5df1b9d0-cc78-4d14-a006-9230ded9d808/items/6581f805-40d5-4bdb-af12-d43218fb9886/cutout_6581f805-40d5-4bdb-af12-d43218fb9886.png');
}

main().catch(console.error);
