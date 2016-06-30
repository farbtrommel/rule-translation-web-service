package de.farbtrommel.rtws.execution;

import de.farbtrommel.rts.RuleLanguage;
import de.farbtrommel.rts.UnknownRulesLanguageException;
import de.farbtrommel.rts.service.RuleTranslationService;
import de.farbtrommel.rts.translation.RuleTranslationException;
import ws.prova.api2.ProvaCommunicator;
import ws.prova.api2.ProvaCommunicatorImpl;

import javax.xml.bind.JAXBException;
import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.StringReader;
import java.util.AbstractMap;
import java.util.List;

/**
 * Prova Abstraction to convert the provided source code to prova.
 * After init this class run method reasoning to retrieve results.
 */
public class ProvaExecution {

    private ExecutionCall q;
    private RuleTranslationService rts;

    public ProvaExecution(ExecutionCall q, RuleTranslationService rts) throws UnknownRulesLanguageException,
            IOException, RuleTranslationException, JAXBException {
        this.q = q;
        this.rts = rts;

        prepareExecution();
    }

    /**
     * Translate input to prova, only when is necessary.
     *
     * @throws UnknownRulesLanguageException
     * @throws JAXBException
     * @throws RuleTranslationException
     * @throws IOException
     */
    private void prepareExecution() throws UnknownRulesLanguageException, JAXBException,
            RuleTranslationException, IOException {
        if (!q.language.equals("prova")) {
            RuleLanguage in = rts.guessLanguage(q.language);
            RuleLanguage out = rts.guessLanguage("prova");

            //Translate to prova
            ByteArrayOutputStream provaCode = new ByteArrayOutputStream();
            rts.translate(q.source, in, out, provaCode, null);
            q.translation = provaCode.toString();
        }
    }

    /**
     * Init. Prova load default library, decision table, set variables and query knowledge base.
     *
     * @return List of query result to knowledge base
     */
    public Object reasoning() {
        try {
            String defaultProvaLibraries = "public/prova/default-libraries.prova";
            if (System.getenv("FILE_LOCATION") != null) {
                defaultProvaLibraries = System.getenv("FILE_LOCATION") +  "/prova/default-libraries.prova";
            }
            //Init Prova. @see default-libraries.prova file
            ProvaCommunicator prova = new ProvaCommunicatorImpl("rts-prova",
                    defaultProvaLibraries, ProvaCommunicatorImpl.SYNC);

            //Load transferred rule
            BufferedReader br = new BufferedReader(new StringReader(q.getSource()));
            List solutions = (List) prova.consultSync(br, "Rulebases", new Object[]{});

            //Set context predicates
            String context = parseParameter();
            br = new BufferedReader(new StringReader(context));
            solutions = (List) prova.consultSync(br, "Context", new Object[]{});

            String query = parseQuery();
            br = new BufferedReader(new StringReader(query));
            solutions = (List) prova.consultSync(br, "Query", new Object[]{});

            prova.stop();

            return solutions;

        } catch (IOException ex) {
            return ex;
        } catch (UnsupportedOperationException ex) {
            return ex;
        } catch (UnknownRulesLanguageException ex) {
            return ex;
        } catch (JAXBException e) {
            return e;
        } catch (RuleTranslationException e) {
            return e;
        } catch (Exception e) {
            return e;
        }
    }

    /**
     * Set default query, otherwise use the query from request.
     *
     * @return string with one or more queries.
     */
    private String parseQuery() {
        if (q.queries.isEmpty())
            return ":- solve(decisionTable(Key, Name, Label, Entries, DecisionTable)).\n" +
                    ":- solve(derive(outputEntry(DecisionTable, Name, Row, Id, Value))).\n" +
                    ":- solve(derive(inputEntry(DecisionTable, Column, Row))).\n";
        else {
            StringBuilder str = new StringBuilder();
            for (String query : q.queries) {
                str.append(":- solve(" + q.queries + ").\n");
            }
            return str.toString();
        }
    }

    /**
     * Convert the parameter list to Prova predicates.
     * context('qualified name', Value) :- Value = 'content'.
     *
     * @return a string contains a list of context predicates.
     */
    private String parseParameter() {
        StringBuilder context = new StringBuilder();
        for (AbstractMap.SimpleEntry<String, String> item : q.parameters) {
            if (!item.getValue().isEmpty()) {
                context.append("context(\"" + item.getKey() + "\", Value) :- Value = " + item.getValue() + ".\n");
            }
        }
        return context.toString();
    }

    /**
     * Assembles the Prova source code. The purpose is to run it modify and locally.
     *
     * @param host The current host to include prova libraries.
     * @return Text file with the full code.
     */
    public String sourceCode(String host) {
        StringBuilder str = new StringBuilder();

        str.append("%\n" +
                "% Created by Rule Translation Web Service (RTWS)\n" +
                "% Author Simon Koennecke simon [at] farbtrommel.de\n" +
                "%\n" +
                "\n" +
                ":- eval(consult('http://" + host + "/prova/default-libraries.prova')).\n" +
                "\n");
        str.append("% Query \n");
        str.append(parseQuery());
        str.append("% Parameter \n");
        str.append(parseParameter());
        str.append("% Rulebase \n");
        str.append(q.getSource());

        return str.toString();
    }
}
