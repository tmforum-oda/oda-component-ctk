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


class HighLevelSummaryReport:
    def __init__(self, results_files):
        self.results_files = results_files

    def generate(self):
        pass

    def add_ctk_report(self, report):
        pass

    def add_baseline_report(self, report):
        pass


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


    def render(self):
        self.result_data = self.results.load_result_files()
        self.renderer.add_template_data(self.result_data)
        self.renderer.render(self.result_data)
        self.results.copy_results_to_output_directory(self.output_path)


class MustacheRenderer:
    def __init__(self, template_path, output_path):
        self.template_path = template_path
        self.output_path = output_path.joinpath("index.html")
        self.data = {
            "sections": []
        }

    def render(self, data):
        with self.template_path.open("r") as f:
            template = f.read()

        template_args = {
            "template": template,
            "data": self.data,
        }

        with self.output_path.open("w+") as f:
            f.write(chevron.render(**template_args))


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