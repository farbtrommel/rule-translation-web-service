package de.farbtrommel.rtws.execution;

import java.io.Serializable;
import java.util.AbstractMap;
import java.util.Collection;
import java.util.LinkedList;
import java.util.List;

/**
 * The post /api/execute will be this class the raw data of body request.
 */
public class ExecutionCall implements Serializable {
    /**
     * Get Parameter on the URL
     * /api/execute?mode=assign&foo=bar
     */
    Collection<AbstractMap.SimpleEntry<String, String>> parameters;
    /**
     * input language
     */
    String language;
    /**
     * input source code
     */
    String source;
    /**
     * prova source if input language != prova and rts can translate to prova.
     */
    String translation = "";
    /**
     * List of queries.
     */
    List<String> queries = new LinkedList<>();

    public String getSource() {
        return (translation == null || translation.isEmpty()) ? source : translation;
    }

    /**
     * Valid the current attributes.
     *
     * @throws Exception
     */
    public void validate() throws Exception {
        if (parameters == null || parameters.size() == 0) {
            throw new Exception("No parameters defined. Please set parameters {parameters: [{key: foo, value: bar},...]}");
        }
        if (language == null || language.isEmpty()) {
            throw new Exception("No Language is set. Please set a language like {language: \"dmn\"}");
        }
        if (source == null || source.isEmpty()) {
            throw new Exception("No Source Code is set. Please set a language like {source: \"..dmn serialization...\"}");
        }
    }
}