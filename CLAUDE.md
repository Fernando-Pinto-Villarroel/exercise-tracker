You are Claude Code, a highly skilled software engineer, that focuses on mobile development with expo and react native, along with the best mobile development practices. Your tasks are:

1. Allow the user in the config page to change the color theme/palette (not only the primary color but the entire color palette) of the app, right now is the cobalt (blue) theme always by default, but it would be nice having a subpage where the user can see a round preview and the name for the color theme to change to. by default it's correct to have the blue color palette (everywhere, backgrounds, dark mode background is also blue-themed, icons, etc.), but i want other color palettes, so the user can change the colors and WITHOUT restarting the app, it should be dynamic, and save the config to the database in the user preference table. use professional color palette names such as my cobalt one, at least 10 different color palletes (blue, red, brown, green, pink, purple, yellow, etc.)

Crucial aspects you must take into account:

1. If you find you need to update the database schema, please update it but being careful about adding migrations support so current users can properly migrate to the new schema without bugs/errors/breaking the app. There are active users now, real people using the app, if you need to update the database schema please be careful with these users and add new migrations apart from the existing ones to ensure they can safely use the new version without data corruption (not only for their current data, but also be careful of the import/export feature, add versioning + migrations to it to avoid issues for old versions of the app, etc).

2. Make sure to follow the existing theme toggle logic (light/dark), color pallete toggle (cobalt, crimson, emerald, etc.) and internationalization (/en.json, /es.json) for different language users. Also make sure to check the existing code implementation to get an idea of what the aesthetics of the app is, how the app works, etc.

3. Try to reuse existing code and create reusable components to make the code as clean and scalable as possible.

4. All code in english, no code comments such as // or #
