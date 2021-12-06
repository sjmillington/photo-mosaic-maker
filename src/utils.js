const Jimp = require('jimp')
const fs = require('fs');
const { MATCH_STYLE_RANDOM } = require('./matchStyles');

const getImageSize = async (path) => {
    return await Jimp.read(path)
        .then(image => {
            return { 
                width: image.bitmap.width,
                height: image.bitmap.height
            }
        }) 
}

function replaceTileRandom (imageHashes) {

    const fileNames = Object.keys(imageHashes)
    const index = Math.floor(Math.random() * fileNames.length)

    return fileNames[index];
}

function replaceTile (cropped, imageHashes) {
    const croppedHash = cropped.hash()

    let minDistance = 1;
    let fileName = ''

    for(let name of Object.keys(imageHashes)) {
        const distance = Jimp.compareHashes(croppedHash, imageHashes[name])

        if(distance < minDistance) {
            minDistance = distance
            fileName = name
        }
    }

    return fileName;
}

const buildTileImageHashes = async (imageDirectory, resizedDir='./resized', width, height, tilesWidth, tilesHeight) => {

    const filenames = fs.readdirSync(imageDirectory)
    const resizedImages = {}
    const imageHashes = {}

    const hashPromises = []
    filenames.forEach(name => {
        if(!name.startsWith('.')) {

            let promise;
            const resizedPath = `${resizedDir}/${name}`
            if(fs.existsSync(resizedPath)) {
                promise = Jimp.read(resizedPath)
                    .then(img => {
                        resizedImages[name] = resizedPath 
                        imageHashes[name] = img.hash()
                    }).catch(err => {
                        console.error(err.message)
                    })    
            } else {
                promise = Jimp.read(`${imageDirectory}/${name}`)
                    .then(img => {
                        
                        resizedImages[name] = resizedPath 

                        let resized = img.resize(width/tilesWidth, height/tilesHeight)
                        resized.write(resizedPath)
                        
                        imageHashes[name] = resized.hash()
                        
                    })
                    .catch(error => {
                        console.error(error)
                    })
            }    

            hashPromises.push(promise)
        }
    
    })

    await Promise.all(hashPromises)
    return { imageHashes, resizedImages } 

}

const buildPhotoMosaic = (baseImgPath, outImgPath, tilesWidth, tilesHeight, imageHashes, resizedDir='./resized', matchStyle, tileOpacity, baseOpacity ) => {

    return Jimp.read(baseImgPath)
        .then(image => {
            const maskPromises = []

            const outputImage = image.clone()

            const widthInterval = Math.floor(image.bitmap.width / tilesWidth);
            const heightInterval = Math.floor(image.bitmap.height / tilesHeight);
            
            for(let i = 0; i < tilesWidth; i++) {
                const startPosX = i * widthInterval;

                for(let j = 0; j < tilesHeight; j++) {
                    const startPosY = j * heightInterval;

                    const cropped = image.clone().crop(startPosX, startPosY, widthInterval, heightInterval)

                    if(cropped) {
                        const replacementFileName = matchStyle === MATCH_STYLE_RANDOM ? replaceTileRandom(imageHashes) : replaceTile(cropped, imageHashes)

                        maskPromises.push(
                            Jimp.read(`${resizedDir}/${replacementFileName}`)
                            .then(resizedImage => {  
                                outputImage.composite(resizedImage, startPosX, startPosY, {
                                    mode: Jimp.BLEND_SOURCE_OVER,
                                    opacityDest: baseOpacity,
                                    opacitySource: tileOpacity
                                    })
                            })
                        )
                    }
                }
            }

            Promise.all(maskPromises).then(() => {
                outputImage.write(outImgPath)
            })

        })
}

module.exports = {
    buildTileImageHashes,
    buildPhotoMosaic,
    getImageSize
}