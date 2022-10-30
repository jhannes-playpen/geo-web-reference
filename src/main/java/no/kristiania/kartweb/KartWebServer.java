package no.kristiania.kartweb;

import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.servlet.DefaultServlet;
import org.eclipse.jetty.servlet.ServletHolder;
import org.eclipse.jetty.util.resource.Resource;
import org.eclipse.jetty.webapp.WebAppContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;

public class KartWebServer {
    private static final Logger logger = LoggerFactory.getLogger(KartWebServer.class);

    private final Server server;

    public KartWebServer(int port) throws IOException {
        this.server = new Server(port);
        server.setHandler(createWebAppHandler());
    }

    private WebAppContext createWebAppHandler() throws IOException {
        var context = new WebAppContext();
        context.setContextPath("/");
        var baseResource = Resource.newClassPathResource("/webapp");
        var sourceResource = getSourceResource(baseResource);
        if (sourceResource == null) {
            context.setBaseResource(baseResource);
        } else {
            context.setBaseResource(sourceResource);
            context.setInitParameter(DefaultServlet.CONTEXT_INIT + "useFileMappedBuffer", "false");
        }

        context.addServlet(new ServletHolder(new GeoJsonServlet()), "/geojson/*");
        return context;
    }

    private Resource getSourceResource(Resource baseResource) throws IOException {
        var file = baseResource.getFile();
        if(file == null) {
            return null;
        }
        var generatedPath = new File(file.toString()
                .replace('\\', '/')
                .replace("target/classes", "target/generated-resources"));
        if (generatedPath.isDirectory()) {
            return Resource.newResource(generatedPath);
        }
        var sourcePath = new File(file.toString()
                .replace('\\', '/')
                .replace("target/classes", "src/main/resources"));
        if (sourcePath.isDirectory()) {
            return Resource.newResource(sourcePath);
        }
        return null;
    }

    private void start() throws Exception {
        server.start();
    }

    private URL getURL() throws MalformedURLException {
        return server.getURI().toURL();
    }

    public static void main(String[] args) throws Exception {
        var server = new KartWebServer(8080);
        server.start();
        logger.info("Started server on {}", server.getURL());
    }
}
