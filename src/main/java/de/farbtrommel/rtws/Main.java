package de.farbtrommel.rtws;

import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;
import de.farbtrommel.rts.RuleLanguage;
import de.farbtrommel.rts.UnknownRulesLanguageException;
import de.farbtrommel.rts.service.RuleTranslationService;
import de.farbtrommel.rts.service.RuleTranslationServiceFactory;
import de.farbtrommel.rts.translation.RuleTranslationException;
import de.farbtrommel.rtws.execution.ExecutionCall;
import de.farbtrommel.rtws.execution.ProvaExecution;
import de.farbtrommel.rtws.execution.ProvaResult;
import spark.ModelAndView;
import spark.template.freemarker.FreeMarkerEngine;
import ws.prova.exchange.ProvaSolution;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;

import static spark.Spark.*;

/**
 * Rule Translation Web Service
 */
public class Main {
    private static Gson sGson = new Gson();
    private static Properties sProperties = new Properties();

    static {
        //Load properties from resource folder
        try {
            InputStream is = Main.class.getClassLoader().getResourceAsStream("app.properties");
            sProperties.load(is);
            is.close();
        } catch (IOException e) {
            e.printStackTrace();
        }

    }

    public static void main(String[] args) {
        //Setup web service
        if (System.getenv("PORT") != null) {
            port(Integer.valueOf(System.getenv("PORT")));
            System.out.println("Start at http://localhost:" + System.getenv("PORT"));
        } else {
            port(5050);
            System.out.println("Start at http://localhost:5050");
        }

        if (System.getenv("FILE_LOCATION") != null) {
            System.out.println("Run with local folder: " + System.getenv("FILE_LOCATION"));
            //For development reason, the js files can refresh without restarting web server...
            externalStaticFileLocation(System.getenv("FILE_LOCATION"));
        } else {
            staticFileLocation("/public");
        }


        //Load rule translation service
        RuleTranslationService ruleTranslationService = RuleTranslationServiceFactory.createRuleTranslationService();

        /**
         * Body: @see de.farbtrommel.rtws.execution.ExecutionCall
         * Return: @see [Query1, Query2, ... , QueryN]
         */
        post("/api/execute/", (req, res) -> {
            res.type("application/json");
            try {
                ExecutionCall q = sGson.fromJson(req.body(), ExecutionCall.class);
                q.validate();
                ProvaExecution pRun = new ProvaExecution(q, ruleTranslationService);

                return new ProvaResult((List<ProvaSolution[]>) pRun.reasoning());

            } catch (JsonSyntaxException ex) {
                res.status(503);
                return new Exception("Post body is not right formatted.");
            } catch (Exception ex) {
                res.status(503);
                return ex;
            }
        }, sGson::toJson);

        /**
         * Body: de.farbtrommel.rtws.execution.ExecutionCall
         * Return: String executable Prova code
         */
        post("/api/execute/file/", (req, res) -> {
            try {
                res.status(200);
                res.type("text/plain");
                ExecutionCall q = sGson.fromJson(req.body(), ExecutionCall.class);
                q.validate();
                ProvaExecution pRun = new ProvaExecution(q, ruleTranslationService);
                return pRun.sourceCode(req.host());
            } catch (JsonSyntaxException ex) {
                res.status(503);
                res.type("text/plain");
                return "% Error: Post body is not right formatted.";
            } catch (Exception ex) {
                res.status(503);
                res.type("text/plain");
                return "% Error: " + new Gson().toJson(ex);
            }
        });

        /**
         * List all supported languages for x to ruleml
         */
        get("/api/from-ruleml/", (req, res) -> {
            Set<RuleLanguage> tmp = ruleTranslationService.getSupportedLanguagesFromRuleML();
            if (tmp.size() > 0) {
                return tmp;
            } else {
                return new RuleTranslationException("Non languages are supported");
            }

        }, sGson::toJson);

        /**
         * List all supported languages for ruleml to x
         */
        get("/api/to-ruleml/", (req, res) -> {
            Set<RuleLanguage> tmp = ruleTranslationService.getSupportedLanguagesToRuleML();
            if (tmp.size() > 0) {
                return tmp;
            } else {
                return new RuleTranslationException("Non languages are supported");
            }

        }, sGson::toJson);

        /**
         * Body: raw input scheme
         * in: type of input
         * out: type of output
         * return translated input to "out" language
         */
        post("/api/translate/:in/:out/", (req, res) -> {
            try {
                HashMap<String, String> options = new HashMap<String, String>();
                for (String qParam : req.queryParams()) {
                    options.put(qParam, req.queryParams(qParam));
                }

                RuleLanguage in = ruleTranslationService.guessLanguage(req.params("in"));
                RuleLanguage out = ruleTranslationService.guessLanguage(req.params("out"));


                HttpServletResponse raw = res.raw();
                raw.setContentType(out.getMimeType());
                raw.setHeader("Content-Type", out.getMimeType());

                ruleTranslationService.translate(req.body(), in, out,
                        res.raw().getOutputStream(), options);

                raw.getOutputStream().flush();
                raw.getOutputStream().close();

                return raw;
            } catch (UnknownRulesLanguageException ex) {
                res.type("application/json");
                res.status(500);
                return (new Gson()).toJson(ex);
            } catch (RuleTranslationException ex) {
                res.type("application/json");
                res.status(500);
                return (new Gson()).toJson(ex);
            }

        });

        get("/", (request, response) -> {
            Map<String, Object> attributes = new HashMap<>();
            attributes.put("path", "home");

            return new ModelAndView(attributes, "index.ftl");
        }, new FreeMarkerEngine());

        get("/decision-table", (request, response) -> {
            Map<String, Object> attributes = new HashMap<>();
            attributes.put("path", "decision-table");

            return new ModelAndView(attributes, "index.ftl");
        }, new FreeMarkerEngine());

        get("/s-feel", (request, response) -> {
            Map<String, Object> attributes = new HashMap<>();
            attributes.put("path", "s-feel");

            return new ModelAndView(attributes, "index.ftl");
        }, new FreeMarkerEngine());

        get("/doc", (request, response) -> {
            Map<String, Object> attributes = new HashMap<>();
            attributes.put("path", "doc");
            attributes.put("host", request.host());
            attributes.put("rtsversion", sProperties.get("rts"));

            return new ModelAndView(attributes, "index.ftl");
        }, new FreeMarkerEngine());

        get("/execute", (request, response) -> {
            Map<String, Object> attributes = new HashMap<>();
            attributes.put("path", "execute");
            attributes.put("host", request.host());


            return new ModelAndView(attributes, "index.ftl");
        }, new FreeMarkerEngine());

    }

}
