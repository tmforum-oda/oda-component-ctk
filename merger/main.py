import json
import chevron
from pathlib import Path

class TestResultsLoader:
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
                    "json_path": str(jsonreport)
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
                    "json_path": str(json_report)
                }
            else: 
                print("Warning: baseline report not found: ", html_report)



class reportGenerator:
    def __init__(self):
        self.results = TestResultsLoader(Path("../results"))
        pass

    def generate_report(self):
        files =  {
            "apictk_reports": list(self.results.glob_apictk_reports()),
            "baseline_ctk_reports": list(self.results.load_baseline_ctk_reports()),
        }

        return {
            **files,
            "template_data": gen_template_data(files) 
        }


class reportRenderer:
    def __init__(self, report_data_generator):
        self.report_data = report_data_generator.generate_report()
        print(json.dumps(self.report_data, indent=4))
        self.output_path = Path("../ODACTK-report-test")
        self.template_path = Path("report.mustache")
        self.output_path.mkdir(parents=True, exist_ok=True)

    def render(self):
        render_template(self.template_path, self.output_path.joinpath("report.html"), self.report_data)


class HighLevelSummaryReport:
    def __init__(self, report_data):
        self.report_data = report_data

    def generate(self):
        pass

    def add_ctk_report(self, report):
        pass

    def add_baseline_report(self, report):
        pass


def gen_template_data(files):
    template_data = {}
    for report_type in files:
        for report in files[report_type]:
            template_data[report["name"]] = report
    return template_data

def render_template(template_path, output_path, data):
    with template_path.open("r") as f:
        template = f.read()

    template_args = {
        "template": template,
        "data": data,
    }

    with output_path.open("w+") as f:
        f.write(chevron.render(**template_args))


def main():
    report_data_generator = reportGenerator()
    report_renderer = reportRenderer(report_data_generator)
    report_renderer.render()
    return 0

if __name__ == "__main__":
    import sys
    sys.exit(main())