# Ruby World

[**Try it out here!**](https://rubyworld.benank.com)

<img width="809" alt="image" src="https://github.com/user-attachments/assets/74b1a297-7c5d-4393-b6cb-8792ce88d0e7" />


Realtime online 2D game world. Built with Cloudflare Durable Objects & Pages, React, and Typescript. Inspired by Pokémon Ruby. Built in a weekend for fun.

Uses:
 - Cloudflare Durable Objects + Cloudflare Workers + PartyKit for realtime communication via websockets
 - React / Typescript
 - shadcn/ui
 - Tailwindcss
 - Cloudflare Pages

## Developing

1. Install all packages with `npm install` (and so the same in the `server` directory)
2. Run `npm run dev` to start the development server.
3. In another terminal, navigate into the server directory and run `npm run dev` to start the realtime server.

## Building

1. Run `npm run build` to generate static files in `/dist`.


## Credits

Music credit: [Lud and Schlatts Musical Emporium](https://www.youtube.com/@ludandschlattsmusicalempor6746)
