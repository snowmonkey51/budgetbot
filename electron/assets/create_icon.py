import base64
import struct

# Create a simple 16x16 PNG icon (minimal viable icon)
width, height = 16, 16
def create_png():
    def write_png(buf, width, height):
        def crc32(data):
            crc = 0xffffffff
            for byte in data:
                crc ^= byte
                for _ in range(8):
                    if crc & 1:
                        crc = (crc >> 1) ^ 0xedb88320
                    else:
                        crc >>= 1
            return crc ^ 0xffffffff
        
        def write_chunk(chunk_type, data):
            chunk = struct.pack('>I', len(data)) + chunk_type + data
            chunk += struct.pack('>I', crc32(chunk_type + data))
            return chunk
        
        # PNG signature
        png = b'\x89PNG\r\n\x1a\n'
        
        # IHDR chunk
        ihdr = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
        png += write_chunk(b'IHDR', ihdr)
        
        # Simple blue gradient data
        pixels = []
        for y in range(height):
            pixels.append(0)  # Filter type
            for x in range(width):
                # RGB values - create a simple blue icon
                if x < 8 and y < 8:
                    pixels.extend([70, 130, 230])  # Blue
                else:
                    pixels.extend([50, 70, 200])   # Darker blue
        
        # Compress the pixel data (simplified)
        import zlib
        idat_data = zlib.compress(bytes(pixels))
        png += write_chunk(b'IDAT', idat_data)
        
        # IEND chunk
        png += write_chunk(b'IEND', b'')
        
        return png

    return create_png()

# Write the icon
with open('icon.png', 'wb') as f:
    f.write(create_png())
print("Basic icon created")
