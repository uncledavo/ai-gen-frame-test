import { NextRequest, NextResponse } from "next/server";
import { getSSLHubRpcClient, Message } from "@farcaster/hub-nodejs";
import fetch from 'node-fetch';
const HUB_URL = process.env["HUB_URL"] || "nemes.farcaster.xyz:2283";
const hubClient = getSSLHubRpcClient(HUB_URL);
const postUrl = `${process.env["HOST"]}/api/code`;

export async function POST(req: NextRequest) {
  const {
    untrustedData: { inputText },
    trustedData: { messageBytes },
  } = await req.json();
  const frameMessage = Message.decode(Buffer.from(messageBytes, "hex"));
  const validateResult = await hubClient.validateMessage(frameMessage);
  if (validateResult.isOk() && validateResult.value.valid) {
    const validMessage = validateResult.value.message;

    let urlBuffer = validMessage?.data?.frameActionBody?.url ?? [];
    const urlString = Buffer.from(urlBuffer).toString("utf-8");
    if (!urlString.startsWith(process.env["HOST"] ?? "")) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    // Assuming inputText is the text you want to use for image generation
    try {
      const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: 'ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4',
          input: {
            prompt: inputText,
          },
        }),
      });

      if (!replicateResponse.ok) {
        throw new Error('Failed to generate image with Replicate');
      }

      const replicateData = await replicateResponse.json();
      const imageUrl = replicateData.output;

      // Use `imageUrl` in your response
      return new NextResponse(
        `<!DOCTYPE html>
        < <html>
          < <head>
            < <title>Echo Says:</title>
            < <meta property="og:title" content="Echo Says:" />
            < <meta property="og:image" content="${imageUrl}" />
            < <meta name="fc:frame" content="vNext" />
            < <meta name="fc:frame:post_url" content="${postUrl}" />
            < <meta name="fc:frame:image" content="${imageUrl}" />
            < <meta name="fc:frame:button:1" content="See code" />
            < <meta name="fc:frame:button:1:action" content="post_redirect" />
          </head>
          < <body/>
        </html>`,
        {
          status: 200,
          headers: {
            "Content-Type": "text/html",
          },
        }
      );
    } catch (error) {
      console.error('Error calling Replicate:', error);
      return new NextResponse("Internal Server Error", { status: 500 });
    }
  } else {
    return new NextResponse("Unauthorized", { status: 401 });
  }
}

export const GET = POST;
