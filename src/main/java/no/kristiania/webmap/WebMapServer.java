package no.kristiania.webmap;

import org.eclipse.jetty.server.CustomRequestLog;
import org.eclipse.jetty.server.Handler;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.util.resource.Resource;
import org.eclipse.jetty.webapp.WebAppContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.MalformedURLException;
import java.net.URL;

public class WebMapServer {
    private static final Logger logger = LoggerFactory.getLogger(WebMapServer.class);

    private final Server server;

    public WebMapServer(int port) {
        this.server = new Server(port);
        server.setRequestLog(new CustomRequestLog());
        server.setHandler(createWebApp());
    }

    private Handler createWebApp() {
        var context = new WebAppContext();
        context.setContextPath("/");
        context.setBaseResource(Resource.newClassPathResource("/webapp"));
        return context;
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
