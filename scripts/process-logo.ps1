$code = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.Collections.Generic;

public class LogoProcessor
{
    public static void Process(string inputPath, string outputPath)
    {
        using (Bitmap src = new Bitmap(inputPath))
        {
            int w = src.Width;
            int h = src.Height;
            using (Bitmap dst = new Bitmap(w, h, PixelFormat.Format32bppArgb))
            {
                Rectangle rect = new Rectangle(0, 0, w, h);
                BitmapData srcData = src.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
                BitmapData dstData = dst.LockBits(rect, ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);

                int bytes = Math.Abs(srcData.Stride) * h;
                byte[] buffer = new byte[bytes];
                byte[] outBuffer = new byte[bytes];
                Marshal.Copy(srcData.Scan0, buffer, 0, bytes);

                int stride = Math.Abs(srcData.Stride);
                bool[] visited = new bool[w * h];
                bool[] isOuter = new bool[w * h];
                Queue<int> q = new Queue<int>();

                for (int x = 0; x < w; x++)
                {
                    q.Enqueue(x);
                    q.Enqueue((h - 1) * w + x);
                    visited[x] = true;
                    visited[(h - 1) * w + x] = true;
                }
                for (int y = 0; y < h; y++)
                {
                    int l = y * w;
                    int r = y * w + (w - 1);
                    if (!visited[l]) { q.Enqueue(l); visited[l] = true; }
                    if (!visited[r]) { q.Enqueue(r); visited[r] = true; }
                }

                while (q.Count > 0)
                {
                    int curr = q.Dequeue();
                    int px = curr % w;
                    int py = curr / w;
                    int offset = py * stride + px * 4;

                    byte b = buffer[offset];
                    byte g = buffer[offset + 1];
                    byte r = buffer[offset + 2];

                    // Outer white/off-white background
                    if (r > 225 && g > 225 && b > 225)
                    {
                        isOuter[curr] = true;

                        if (px > 0 && !visited[curr - 1]) { visited[curr - 1] = true; q.Enqueue(curr - 1); }
                        if (px < w - 1 && !visited[curr + 1]) { visited[curr + 1] = true; q.Enqueue(curr + 1); }
                        if (py > 0 && !visited[curr - w]) { visited[curr - w] = true; q.Enqueue(curr - w); }
                        if (py < h - 1 && !visited[curr + w]) { visited[curr + w] = true; q.Enqueue(curr + w); }
                    }
                }

                for (int y = 0; y < h; y++)
                {
                    for (int x = 0; x < w; x++)
                    {
                        int curr = y * w + x;
                        int offset = y * stride + x * 4;

                        if (isOuter[curr])
                        {
                            outBuffer[offset] = 0;
                            outBuffer[offset + 1] = 0;
                            outBuffer[offset + 2] = 0;
                            outBuffer[offset + 3] = 0;
                        }
                        else
                        {
                            outBuffer[offset] = buffer[offset];
                            outBuffer[offset + 1] = buffer[offset + 1];
                            outBuffer[offset + 2] = buffer[offset + 2];
                            outBuffer[offset + 3] = 255;
                        }
                    }
                }

                Marshal.Copy(outBuffer, 0, dstData.Scan0, bytes);
                src.UnlockBits(srcData);
                dst.UnlockBits(dstData);

                dst.Save(outputPath, ImageFormat.Png);
            }
        }
    }
}
"@

Add-Type -TypeDefinition $code -ReferencedAssemblies "System.Drawing"

$inputPath = Resolve-Path "C:\Users\nivey\.gemini\antigravity\brain\d8aa7c96-a4b1-45d5-ac32-f20a339616ae\.user_uploaded\media_1793738859388_cf6d2e3a.jpg"
$outputPath = Join-Path (Get-Location) "public\images\logo.png"

[LogoProcessor]::Process($inputPath, $outputPath)
Write-Output "Logo successfully generated with transparent background: $outputPath"
