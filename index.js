const fs = require('fs')
const Jimp = require('jimp')

const tilesWidth = 24
const tilesHeight = 24
const imageDirectory =  './big_set'
const baseImg = './IMG_2886.jpeg'
const resizedDir = `./resized-${tilesWidth}-${tilesHeight}`

const imageHashes = {}
const resizedImages = {}

let width = 4032;
let height = 3024;

function replaceTileRandom (cropped) {
    const croppedHash = cropped.hash()

    let minDistance = 1;
    let fileName = ''

    const fileNames = Object.keys(imageHashes)
    const index = Math.floor(Math.random() * fileNames.length)

    return fileNames[index];
}

function replaceTile (cropped) {
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

const filenames = fs.readdirSync(imageDirectory)

const hashPromises = []
filenames.forEach(name => {
    console.log(name)
    if(!name.startsWith('.')) {

        let promise;
        const resizedPath = `${resizedDir}/${name}`
        if(fs.existsSync(resizedPath)) {
            console.log(resizedPath)
            promise = Jimp.read(resizedPath)
                .then(img => {
                    resizedImages[name] = resizedPath 
                    imageHashes[name] = img.hash()
                }).catch(err => {
                    console.log(err.message)
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
                    console.log(error)
                    console.log(name)
                })
        }    

        hashPromises.push(promise)
        
    }
   
})

Promise.all(hashPromises).then(() => {

    Jimp.read(baseImg)
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
                        const replacementFileName = replaceTile(cropped)
    
                        maskPromises.push(
                            Jimp.read(`${resizedDir}/${replacementFileName}`)
                            .then(resizedImage => {  
                                outputImage.composite(resizedImage, startPosX, startPosY, {
                                    ode: Jimp.BLEND_SOURCE_OVER,
                                    opacityDest: 1,
                                    opacitySource: 0.4
                                  })
                            })
                        )
                    }
                
                }
            }

            Promise.all(maskPromises).then(() => {
                outputImage.write('./out/full.jpg')
            })
     
        })

})





