package no.kristiania.webmap;

import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

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
}
