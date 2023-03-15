import json
import chevron
import shutil
from pathlib import Path

class ResultsLoader:
    def __init__(self, results_path):
        self.results_path = results_path
        self.baseline_report_names = [
            "Generic_static-report",
            "Generic_dynamic-report",
            "Specific_static-report",
            "Specific_dynamic-report",
        ]
        self.report_types = [
            "api-ctk",
            "baseline-ctk"
        ]

    def glob_apictk_reports(self):
        for htmlreport in (self.results_path / "api-ctk").glob("*.html"):
            jsonreport = htmlreport.with_suffix(".json")
            if jsonreport.exists():
                yield {
                    "name": htmlreport.stem,
                    "html_path": str(htmlreport),
                    "json_path": str(jsonreport),
                    "type": "api-ctk"
                }
            else:
                print("Warning: json report not found: ", jsonreport)

    def load_baseline_ctk_reports(self):
        for report_name in self.baseline_report_names:
            html_report = (self.results_path / "baseline-ctk" / f"{report_name}.html")
            json_report = html_report.with_suffix(".json")
            if html_report.exists() and json_report.exists():
                yield {
                    "name": report_name,
                    "html_path": str(html_report),
                    "json_path": str(json_report),
                    "type": "component-ctk"
                }
            else: 
                print("Warning: baseline report not found: ", html_report)



class ResultsProcessor:
    def __init__(self):
        self.results_path = Path("../results")
        self.results = ResultsLoader(self.results_path)
        pass

    def load_result_files(self):
        results = {
            "reports": [
                *list(self.results.glob_apictk_reports()),
                *list(self.results.load_baseline_ctk_reports()),
            ]
        }
        #print(json.dumps(results, indent=4))
        return results
    
    def copy_results_to_output_directory(self, out_path: Path):
        shutil.copytree(
            self.results_path / "baseline-ctk" / "assets", 
            out_path / "assets", 
            dirs_exist_ok=True
        )
        for type in self.results.report_types:
            for report in (self.results_path / type).glob("*.*"):
                shutil.copyfile(report, out_path / report.name)

class MochaReportProcessor:
    def __init__(self, report):
        self.report_data = report

    def get_total(self):
        return self.report_data["stats"]["tests"]
    
    def get_passed(self):
        return self.report_data["stats"]["passes"]

    def get_failed(self):
        return self.report_data["stats"]["failures"]
    
    def get_skipped(self):
        return self.report_data["stats"]["skipped"]
    
    def get_pass_percent(self):
        return self.report_data["stats"]["passPercent"]
    
    def get_error_count(self):
        return 0


class PostmanReportProcessor:
    def __init__(self, report):
        self.report_data = report

    def get_total(self):
        return 0
    
    def get_passed(self):
        return 0

    def get_failed(self):
        return 0
    
    def get_skipped(self):
        return 0
    
    def get_pass_percent(self):
        return 0
    
    def get_error_count(self):
        return 0

class HighLevelSummaryReport:
    def __init__(self):
        self.results = {
            "summary_table": []
        }
        
        self.report_cache = {}

        self.processors = {
            "api-ctk": PostmanReportProcessor,
            "component-ctk": MochaReportProcessor
        }

    def generate(self, out_path: Path):
        with out_path.joinpath("summary.json").open("w") as f:
            json.dump(self.results, f, indent=4)
        return self.results

    def add_report_data(self, data):
        for report in data["reports"]:
            with Path(report["json_path"]).open("r") as f:
                report_data = json.load(f)
            self.report_cache[report["name"]] = report_data
            processor = self.processors[report["type"]](report_data)
            self.results["summary_table"].append({
                "name": report["name"],
                "type": report["type"],
                "passed": processor.get_passed(),
                "failed": processor.get_failed(),
                "skipped": processor.get_skipped(),
                "total": processor.get_total(),
                "errors": processor.get_error_count(),
            })


class reportRenderer:
    def __init__(self, results):
        self.results = results
        self.output_path = Path("../ODACTK-report-test")
        self.template_path = Path("report.mustache")
        self.output_path.mkdir(parents=True, exist_ok=True)
        self.renderer = MustacheRenderer(
            self.template_path, 
            self.output_path, 
        )
        self.sumamry_reporter = HighLevelSummaryReport()


    def render(self):
        self.result_data = self.results.load_result_files()
        self.sumamry_reporter.add_report_data(self.result_data)
        summary = self.sumamry_reporter.generate(self.output_path)
        self.renderer.add_summary(summary)
        self.renderer.add_template_data(self.result_data)
        self.renderer.render()
        self.results.copy_results_to_output_directory(self.output_path)


class MustacheRenderer:
    def __init__(self, template_path, output_path):
        self.template_path = template_path
        self.output_path = output_path.joinpath("index.html")
        self.data = {
            "sections": [],
            "summary": {}
        }

    def render(self):
        with self.template_path.open("r") as f:
            template = f.read()

        template_args = {
            "template": template,
            "data": self.data,
        }

        with self.output_path.open("w+") as f:
            f.write(chevron.render(**template_args))


    def add_summary(self, summary):
        self.data["summary"] = summary

    def add_template_data(self, data):
        for report in data["reports"]:
            self.data["sections"].append({
                "name": report["name"],
                "type": report["type"],
                "html_path": Path(report["html_path"]).name,
                "json_path": Path(report["json_path"]).name,
                "Section_title": f"{report['type']}: {report['name']}"
            })
            

def main():
    results = ResultsProcessor()
    report_renderer = reportRenderer(results)
    report_renderer.render()
    return 0

if __name__ == "__main__":
    import sys
    sys.exit(main())