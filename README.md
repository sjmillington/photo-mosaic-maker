# PhotoMosaic For So `FotoMoFoSo?` 

A photo mosaic maker using `Jimp`. 

## Modes:

`RANDOM` - Randomly matches resized tiles to each section of the base image.
`CLOSEST (default)` - Will take the image hash of every tile, and the image hash of each title-sized section of the image. The program will compare image hashes to find the closest tile for the image section. This works better for LARGE amount of image tiles.

**Make sure you used the `--keep-resized-images` option when messing around with this - it'll save you a lot of time!**

Example: 

`node . mosaic --image-dir ./images/las_dos --base-img ./images/IMG_2886.jpeg --tile-opacity 0.4 --keep-resized-images --overlay-style=random`