package no.kristiania.kartweb;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.net.URL;

public class GeoJsonServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        var pathInfo = req.getPathInfo();
        var resource = getClass().getResource("/geojson" + pathInfo);
        if (resource != null) {
            resp.setContentType("application/geo+json");
            resource.openStream().transferTo(resp.getOutputStream());
        } else {
            resp.sendError(404);
        }
    }
}
