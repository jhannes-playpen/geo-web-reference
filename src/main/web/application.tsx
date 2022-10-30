import * as React from "react";
import { MapView } from "./components/map";

export function Application() {
  return (
    <div>
      <header>
        <h1>Hello React Application</h1>
      </header>
      <MapView />
    </div>
  );
}
