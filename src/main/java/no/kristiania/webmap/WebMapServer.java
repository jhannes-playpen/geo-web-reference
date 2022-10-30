package no.kristiania.webmap;

import org.eclipse.jetty.server.CustomRequestLog;
import org.eclipse.jetty.server.Handler;
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

public class WebMapServer {
    private static final Logger logger = LoggerFactory.getLogger(WebMapServer.class);

    private final Server server;

    public WebMapServer(int port) throws IOException {
        this.server = new Server(port);
        server.setRequestLog(new CustomRequestLog());
        var context = createWebApp();
        context.addServlet(new ServletHolder(new GeoJsonServlet()), "/geojson/*");
        server.setHandler(context);
    }

    private WebAppContext createWebApp() throws IOException {
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
        return context;
    }

    private Resource getSourceResource(Resource baseResource) throws IOException {
        var baseDir = baseResource.getFile();
        if (baseDir == null) {
            return null;
        }
        var sourceDir = new File(baseDir.toString()
                .replace('\\', '/')
                .replace("target/classes", "src/main/resources"));
        if (sourceDir.isDirectory()) {
            return Resource.newResource(sourceDir);
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
        var server = new WebMapServer(8080);
        server.start();
        logger.info("Started server on {}", server.getURL());
    }
}
