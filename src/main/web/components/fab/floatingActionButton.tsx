import * as React from "react";
import { FormEvent, useState } from "react";
import classNames from "classnames";
import { Map } from "ol";

export interface Incident {
  label: string;
  position: number[];
}

function AddIncidentForm({
  onClose,
  position,
}: {
  onClose(): void;
  position: number[];
}) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const incidentsJson = localStorage.getItem("incidents");
    const incidents = incidentsJson ? JSON.parse(incidentsJson) : [];
    incidents.push(newIncident);
    localStorage.setItem("incidents", JSON.stringify(incidents));
    onClose();
  }
  const [newIncident, setNewIncident] = useState<Incident>({
    label: "",
    position,
  });

  return (
    <div>
      <h1>Add new incident</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Incident label:</label>
          <input
            autoFocus={true}
            value={newIncident.label}
            onChange={(e) =>
              setNewIncident((old) => ({ ...old, label: e.target.value }))
            }
          />
        </div>
        <button disabled={newIncident.label.length === 0}>Submit</button>
      </form>
    </div>
  );
}

export function FloatingActionButton({ map }: { map: Map }) {
  const [hideActions, setHideActions] = useState(true);
  const [hideDetails, setHideDetails] = useState(true);

  function handleExpandButton() {
    setHideActions((b) => !b);
  }

  function handleAddIncident() {
    setHideDetails(false);
  }

  return (
    <>
      {!hideDetails && (
        <div
          className={"detailClickTarget"}
          onClick={() => setHideDetails(true)}
        />
      )}
      <div className={classNames("featureDetails", { hideDetails })}>
        {!hideDetails && (
          <AddIncidentForm
            onClose={() => setHideDetails(true)}
            position={map.getView().getCenter()!}
          />
        )}
      </div>
      <div className="fab">
        <div className={classNames("actions", { hideActions })}>
          <button onClick={handleAddIncident}>Add incident</button>
          <button>Add resource</button>
        </div>
        <button onClick={handleExpandButton}>
          +{hideActions ? "" : " Add"}
        </button>
      </div>
    </>
  );
}
