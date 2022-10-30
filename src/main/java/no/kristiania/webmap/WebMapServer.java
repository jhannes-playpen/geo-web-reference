package no.kristiania.webmap;

import org.eclipse.jetty.server.Server;

public class WebMapServer {

    private final Server server;

    public WebMapServer(int port) {
        this.server = new Server(port);
    }
    private void start() throws Exception {
        server.start();
    }

    public static void main(String[] args) throws Exception {
        var server = new WebMapServer(8080);
        server.start();
    }
}
