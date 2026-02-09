You are Claude Code, a highly skilled software engineer. Your tasks are:

1. Que el timer al salir de la app contiue en background e incluso si es posible con expo hacer que el timer aparezca en la barra de notificaciones del celular, asi una vez apretado play la única forma de detenerlo es o parandolo manualmente con el botón de pausa o matar el proceso de la app completamente.

2. Al mantener presionado los botones de arriba y abajo en el modal de "Select Completion Time" para seleccionar hora y minutos, que avance más rápido automáticamente para llegar rápidamente al máximo o minimo permitidos (e.g., ahora mismo necesito hacer muchisimos clicks para llegar de 01 a 59 en minutos, es algo molesto).

3. Implementar nuevo feature de **días de descanso válidos**:

- En la pagina de MyExercisesPage, quiero ahora también poder programar dias de descanso para que automaticamente se marquen esos dias como de descanso (logica similar de programar un ejercicio para ese **dia actual y futuro**) ofreciendo un toggle de "Valid Rest Day" que al presionarlo se marque como dia de descanso (desaparecen botones de add exercise, si existen ejercicios para ese dia que se limpien esos ejercicios del plan para ese dia, etc.).

- Asimismo, para **dias pasados**, en la DayDetailsPage también ofrecer ese mismo toggle de "Valid Rest Day" que al presionarlo se marque como dia de descanso (desaparecen botones de done, los ejercicios de ese dia pasado, etc.).

- En el calendario de mes y de semana (monthly page y weekly page) esos dias de descanso que se marquen con celeste clarito en lugar de ser como los dias normales y que no se tomen en cuenta para calcular el streak (longest streak o current streak). En otras palabras, esos dias de descanso no deben ser considerados para las estadisticas, ni para las gráficas ni métricas de las paginas de Statistics (weekly statistics, monthly statistics) (e.g., en la weekly statistics son 7 dias a la semana pero dos estan marcados como dias validos de descanso, entonces las estadisticas, graficos, etc. solo deben considerarse 5 dias porque 2 de ellos ahora son dias de descanso, etc.).

Crucial aspects you must take into account:

1. If you find you need to update the database schema, please update it but being careful about adding migrations support so current users can properly migrate to the new schema without bugs/errors/breaking the app. There are active users now, real people using the app, if you need to update the database schema please be careful with these users and add migrations to ensure they can safely use the new version without data corruption (not only for their current data, but also be careful of the import/export feature, maybe add versioning + migrations to it to avoid issues, etc).

2. Make sure to follow the existing theme toggle logic (light/dark) and internationalization (/en.json, /es.json) for different language users. Also make sure to check the existing code implementation to get an idea of what the aesthetics of the app is, how the app works, etc.

3. Try to reuse existing code and create reusable components to make the code as clean and scalable as possible.
