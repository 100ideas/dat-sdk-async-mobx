import React from "react";
import SDK from "dat-sdk";
const { Hyperdrive } = SDK();

const datFoundationKey =
  "dat://60c525b5589a5099aa3610a8ee550dcd454c3e118f7ac93b7d41b6b850272330";

function getDefaultDat() {
  const archive = Hyperdrive(datFoundationKey);
  // const archive = await DatArchive.load("dat://dat.foundation");

  archive.readFile("/dat.json", "utf8", (err, data) => {
    if (err) throw err;
    console.log("Dat foundation dat.json:", data);
  });

  // return { archive, someData };
}

export const DatComponent = () => (
  <div>
    <p>{`DatArchive.load('dat://dat.foundation')`}</p>
    <pre>{JSON.stringify(getDefaultDat(), null, 2)}</pre>
  </div>
);
