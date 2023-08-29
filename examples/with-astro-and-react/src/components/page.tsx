import React from "react";
import { UploadButton } from '@uploadthing/react'
import type { OurFileRouter } from '../uploadthing';

export default function Page() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center  gap-16 p-24">
            <div className="flex flex-col items-center justify-center gap-4">
                <span className="text-center text-4xl font-bold">
                    {`Upload a file using a button:`}
                </span>

                <UploadButton<OurFileRouter>
                    endpoint="videoAndImage"
                    onClientUploadComplete={(res) => {
                        // Do something with the response
                        console.log("Files: ", res);
                        alert("Upload Completed");
                    }}
                    onUploadError={(error: Error) => {
                        console.log(error.stack);
                        alert(`ERROR! ${error.message}`);
                    }}
                />
            </div>
        </main>
    )
}