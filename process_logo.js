const Jimp = require('jimp');

async function processLogo() {
    try {
        const image = await Jimp.read('./public/logo.png');
        
        // Convert almost-black pixels to transparent
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
            const r = this.bitmap.data[idx + 0];
            const g = this.bitmap.data[idx + 1];
            const b = this.bitmap.data[idx + 2];
            
            // Threshold for black
            if (r < 20 && g < 20 && b < 20) {
                this.bitmap.data[idx + 3] = 0; // Alpha
            }
        });

        // Crop it tightly
        image.autocrop();

        await image.writeAsync('./public/logo_transparent.png');
        console.log("Logo processed successfully");
    } catch (e) {
        console.error("Error processing logo:", e);
    }
}

processLogo();
