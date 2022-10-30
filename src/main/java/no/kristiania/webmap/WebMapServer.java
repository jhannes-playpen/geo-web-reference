package no.kristiania.webmap;

import org.eclipse.jetty.server.Handler;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.util.resource.Resource;
import org.eclipse.jetty.webapp.WebAppContext;

public class WebMapServer {

    private final Server server;

    public WebMapServer(int port) {
        this.server = new Server(port);
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

    public static void main(String[] args) throws Exception {
        var server = new WebMapServer(8080);
        server.start();
    }
}
