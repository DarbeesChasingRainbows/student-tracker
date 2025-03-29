import { type PageProps } from "$fresh/server.ts";

export default function App(props: PageProps) {
  const { Component } = props;
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Student Tracker</title>
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
}
