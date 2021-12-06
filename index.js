const fs = require('fs');
const { buildTileImageHashes, buildPhotoMosaic, getImageSize } = require('./src/utils')
const { MATCH_STYLE_CLOSEST, MATCH_STYLE_RANDOM } = require('./src/matchStyles')

const doTheMosaic = ({ baseImg, imageDirectory, tilesHeight, tilesWidth, keepResized, outPath, matchStyle, tileOpacity, baseOpacity }) => {
    const resizedDir = `./resized/resized-${tilesWidth}-${tilesHeight}`

    getImageSize(baseImg).then(({ width, height }) => {
        buildTileImageHashes(imageDirectory, resizedDir, width, height, tilesWidth, tilesHeight)
        .then(({ imageHashes }) => {
            buildPhotoMosaic(baseImg, outPath, tilesWidth, tilesHeight, imageHashes, resizedDir, matchStyle, tileOpacity, baseOpacity ).finally(() => {
                if(!keepResized) {
                    fs.rmdirSync(resizedDir, { recursive: true })
                }
            })
        })
    })

}

require('yargs')
  .scriptName("foto")
  .usage('$0 <cmd> [args]')
  .command('mosaic', 'welcome ter the photo mosaic maker!', (yargs) => {
    yargs.option('image-dir', {
      type: 'string',
      describe: 'the directory containing your image tiles',
      demandOption: true
    })

    yargs.option('base-img', {
        type: 'string',
        describe: 'the base image to be overlaid',
        demandOption: true
    })

    yargs.option('tiles-wide', {
        type: 'number',
        describe: 'How many images across the image',
        default: 24
    })

    yargs.option('tiles-high', {
        type: 'number',
        describe: 'How many images up the image',
        default: 24
    })

    yargs.option('out-path', {
        type: 'string',
        describe: 'Output path (including file name) of the mosaic',
        default: './out/mosaic.png'
    })

    yargs.option('keep-resized-images', {
        type: 'boolean',
        describe: 'Keeps the resized tiles to speed up subsequent runs. Default location: ./resized/resized-{height}-{width}',
        default: false
    })

    yargs.option('overlay-style', {
        type: 'string',
        describe: 'Chooses which method to overlay each tile. `closest-match` will compare each tile-sized patch for image to the image tiles by hash-code to get the closest match. `random` will do it randomly..',
        default: MATCH_STYLE_CLOSEST,
        choices: [MATCH_STYLE_CLOSEST, MATCH_STYLE_RANDOM]
    })

    yargs.option('tile-opacity', {
        type: 'number',
        describe: 'Opacity of the tile image', 
        default: 0.4
    })
    
    yargs.option('base-opacity', {
        type: 'number',
        describe: 'Opacity of the base image', 
        default: 1
    })

  }, function (argv) {
      const baseImg = argv['base-img']
      const imageDirectory = argv['image-dir']
      const outPath = argv['out-path']
      
      const tilesWidth = argv['tiles-wide']
      const tilesHeight = argv['tiles-high']

      const keepResized = argv['keep-resized-images']
      const matchStyle = argv['overlay-style']

      const tileOpacity = argv['tile-opacity']
      const baseOpacity = argv['base-opacity']

      doTheMosaic({ baseImg, imageDirectory, tilesHeight, tilesWidth, keepResized, matchStyle, outPath, tileOpacity, baseOpacity })
  })

  .help()
  .argv


