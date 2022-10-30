package no.kristiania.webmap;

import jakarta.json.Json;
import jakarta.json.JsonObject;
import jakarta.json.JsonValue;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

public class GeoJsonServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        var resource = getClass().getResource("/geojson/" + req.getPathInfo());
        if (resource != null) {
            resp.setContentType("application/geo+json");
            resource.openStream().transferTo(resp.getOutputStream());
        } else {
            resp.sendError(404);
        }
    }

    public static void main(String[] args) throws IOException {
        convertFeatures();
    }

    private static void listCountries() throws IOException {
        JsonObject featureCollection;
        try (var inputStream = GeoJsonServlet.class.getResourceAsStream("/geojson/ne_50m_populated_places_simple.geojson")) {
            featureCollection = Json.createReader(inputStream).readObject();
        }


        var countries = new TreeSet<String>();

        for (JsonValue feature : featureCollection.getJsonArray("features")) {
            var o = (JsonObject) feature;
            var properties = o.getJsonObject("properties");
            countries.add("\"" + properties.getString("sov0name") + "\"");
        }

        System.out.println(countries);
    }

    private static final Set<String> COUNTRIES_IN_EUROPE = Set.of(
            "Albania", "Andorra", "Angola", "Armenia", "Austria", "Belarus", "Belgium", "Bosnia and Herzegovina", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", "Denmark", "Estonia", "Finland", "French Republic", "Georgia", "Germany", "Greece", "Grenada", "Hungary", "Iceland", "Ireland", "Italy", "Kingdom of Norway", "Kingdom of Spain", "Kingdom of the Netherlands", "Kosovo", "Latvia", "Liechtenstein", "Lithuania", "Luxembourg", "Macedonia", "Malta", "Moldova", "Monaco", "Montenegro", "Poland", "Portugal", "Republic of Serbia", "Romania", "Russia", "San Marino", "Slovakia", "Slovenia", "Sweden", "Switzerland", "Turkey", "Ukraine", "United Kingdom", "United States", "Vatican (Holy Sea)"
    );

    private static void convertFeatures() throws IOException {
        JsonObject featureCollection;
        try (var inputStream = GeoJsonServlet.class.getResourceAsStream("/geojson/ne_50m_populated_places_simple.geojson")) {
            featureCollection = Json.createReader(inputStream).readObject();
        }

        var mapping = Map.of(
                "name", "name",
                "nameascii", "nameascii",
                "latitude", "latitude",
                "longitude", "longitude",
                "pop_min", "pop_max",
                "geonameid", "id",
                "sov0name", "country"
        );

        var features = Json.createArrayBuilder();

        for (JsonValue feature : featureCollection.getJsonArray("features")) {
            var output = Json.createObjectBuilder();
            var o = (JsonObject) feature;
            var properties = o.getJsonObject("properties");

            if (!COUNTRIES_IN_EUROPE.contains(properties.getString("sov0name"))) {
                continue;
            }

            for (String key : mapping.keySet()) {
                output.add(mapping.get(key), properties.get(key));
            }
            features.add(Json.createObjectBuilder()
                    .add("type", "Feature")
                    .add("properties", output)
                    .add("geometry", o.get("geometry"))
            );
        }

        Files.writeString(
                Path.of("src/main/resources/geojson/cities.geojson"),
                Json.createObjectBuilder()
                        .add("type", "FeatureCollection")
                        .add("features", features)
                        .build()
                        .toString()
        );
    }
}
