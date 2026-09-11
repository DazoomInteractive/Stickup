import os
import zipfile
import subprocess
import shutil

print("Building production distribution with Vite...")
subprocess.run(["npm", "run", "build"], check=True)

dist_dir = "dist"
output_zip = "sky-jumper-v2-itch-web.zip"

print(f"Creating Itch.io web-ready zip archive: {output_zip}...")
with zipfile.ZipFile(output_zip, "w", zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(dist_dir):
        for file in files:
            full_path = os.path.join(root, file)
            # The archive path must have index.html directly at the root of the zip
            archive_path = os.path.relpath(full_path, dist_dir)
            zipf.write(full_path, archive_path)
            print(f"  + {archive_path}")

# Also copy to public/ so the user can download it directly via URL
public_dir = "public"
os.makedirs(public_dir, exist_ok=True)
public_zip = os.path.join(public_dir, output_zip)
shutil.copyfile(output_zip, public_zip)

zip_size = os.path.getsize(output_zip) / 1024
print(f"\nSUCCESS! Created {output_zip} ({zip_size:.1f} KB)")
print(f"Ready for Itch.io upload with index.html at archive root.")
