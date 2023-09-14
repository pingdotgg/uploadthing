import { db } from "~/server/db";
import * as schema from '~/server/db/schema'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const files = await db.select().from(schema.files)

    res.status(200).json({
        files
    })
}