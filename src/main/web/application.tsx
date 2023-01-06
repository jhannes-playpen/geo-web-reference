import * as React from "react";
import { MapView } from "./components/map";

export function Application() {
  return (
    <div>
      <header>
        <h1>Map Application</h1>
      </header>
      <MapView />
    </div>
  );
}
