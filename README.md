# world-editor

So this is a world editor. What it does is give you tools to more quickly develop a 2d game world. In order of acts, you can:
- Load an image from which to grab frames on the Frames tab. Use the arrow keys to move around the image and press space to commit a frame. You can delete a frame by clicking on the committed frame.
- Map the frames you committed to animations. You can add and remove animations with the buttons, and select the type of animation you want. You can select and commit frames that you have with the arrow keys and the space bar. You can delete frames from the animations by clicking on them.
- Map the animations to tiles and actors. You can create new tiles and actors in the Tiles and Actors tabs. You can configure their specific attributes and assign an animation to them - one in the case of a tile, one or more in the case of actors - by selecting one with the arrow keys and space bar. You can always select another animation when you change your mind.
- Populate a map with the tiles and actors you have created in the Maps tab. You can create a new map which will default to the first tile you have in your tiles as a background. You can move around with the arrow keys and commit tiles or actors from the panel. You can select the actor or tile you want by clicking on it. You can manage the actors separately in the 'Manage actors' tab
- Save your world with the 'Save world' button which will download your world as a `.json` file (image data included)

How is it built? I've used the Vuejs CLI to set up the project through their UI, and added in Bootstrap and TypeScript support. I use the Vue router and Vuex for a store to manage states with. TypeScript is implemented as strictly as I could manage right now, but it is likely you might run into some `any` types or non-typed variables in for-loops that were causing syntactic confusion. It's also mostly class based, creating the Vue views and components with classes. The `./src/views/Base.ts` class sets up the standard stuff for all the other views that extend it. State management is all done in the `./src/store.ts`. The whole app relies heavily on the `Canvas` html5 element to display all the images. For now the size of tiles is limited to 64x64 pixels and the grid maps are always 15x11.

A tricky part was mapping all the frames, animations, tiles and actors. Since you can commit for instance a frame that an animation might use, you have to be careful when deleting a frame. You can't rearrange the order of the frames because then the expectations of the already existing animations about what frame is where will be confused. For this reason I used some number-to-number mapping, where a unique id maps to the right frame. The ids never change, the proper frame might. The ids also auto-increment so as to avoid having more than one id ever point to a frame, which would happen if we'd take the length of the frames array to calculate the next frame id. This is done with the `Mapper.ts` class in the `./src/classes/Mapper.ts` class file. If anything, it felt like it resembled matching database records in different tables on a primary key.

Plans for expansion:
- Turn some inputs into components
X - Make any navigable canvas mouse-clickable
- Add a grid viewer to the frames screen
- Add steps and unit size to the frame screen
X - Add a button that automatically maps the selected grid density to frames (with a from/to limit)
- Add a button that automatically maps the frames to animations (with a from/to limit)
- Make a color that must be filtered selectable
- Offer centering of transparency-padded selection
- Flood map with tile
- Flood map row with tile
- Flood map column with tile
- Add/remove map column
- Add/remove map row
- Add multiple grid layers for tiles

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Run your tests
```
npm run test
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
