import json
import chevron
import shutil
import subprocess
import yaml
import platform as plt
from yaml import Loader, Dumper
from pathlib import Path
from kubernetes import client as kubeClient
from kubernetes import config as kubeConfig


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
            "baseline-ctk"
            "api-ctk",
        ]
        self.test_level_map = {
            "Generic_static-report": "Level 1",
            "Generic_dynamic-report": "Level 1",
            "Specific_static-report": "Level 2",
            "Specific_dynamic-report": "Level 2",
            "TMF620-Results": "Level 2"
        }

    def glob_apictk_reports(self):
        for htmlreport in (self.results_path / "api-ctk").glob("*.html"):
            json_report = htmlreport.with_suffix(".json")
            with open(json_report, "r") as f:
                report_data = json.load(f)
                processor = PostmanReportProcessor(report_data)

            if json_report.exists():
                yield {
                    "name": htmlreport.stem,
                    "html_path": str(htmlreport),
                    "json_path": str(json_report),
                    "type": "api-ctk",
                    "layer": self.test_level_map[htmlreport.stem],
                    "passed": processor.get_pass_percent() == 100,
                    "failed": processor.get_pass_percent() != 100
                }
            else:
                print("Warning: json report not found: ", json_report)

    def load_baseline_ctk_reports(self):
        for report_name in self.baseline_report_names:
            html_report = (self.results_path / "baseline-ctk" / f"{report_name}.html")
            json_report = html_report.with_suffix(".json")
            with open(json_report, "r") as f:
                report_data = json.load(f)
                processor = MochaReportProcessor(report_data)

            if html_report.exists() and json_report.exists():
                yield {
                    "name": report_name,
                    "html_path": str(html_report),
                    "json_path": str(json_report),
                    "type": "component-ctk",
                    "layer": self.test_level_map[report_name],
                    "passed": processor.get_pass_percent() == 100,
                    "failed": processor.get_pass_percent() != 100
                }
            else: 
                print("Warning: baseline report not found: ", html_report)



class ResultsProcessor:
    def __init__(self):
        self.results_path = Path("../results")
        self.results = ResultsLoader(self.results_path)
        self.result_conformance = {}

    def load_result_files(self):
        results = {
            "reports": [
                *list(self.results.load_baseline_ctk_reports()),
                *list(self.results.glob_apictk_reports())
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
        err_count = 0
        for report in self.report_data["results"]:
            for suit in report["suites"]:
                for test in suit["tests"]:
                    if test["err"]:
                        err_count += 1

        return err_count
    
    def get_version(self):
        return [("mocha_version", self.report_data["meta"]["mocha"]["version"])]

class PostmanReportProcessor:
    def __init__(self, report):
        self.report_data = report

    def get_total(self):
        return self.report_data["run"]["stats"]["assertions"]["total"]
    
    def get_passed(self):
        print(self.get_total(), self.get_failed())
        return self.get_total() - self.get_failed()

    def get_failed(self):
        return self.report_data["run"]["stats"]["assertions"]["failed"] + self.get_skipped()
    
    def get_skipped(self):
        return self.report_data["run"]["stats"]["assertions"]["pending"]
    
    def get_pass_percent(self):
        return (self.get_passed() / self.get_total()) * 100
    
    def get_error_count(self):
        return len(self.report_data["run"]["failures"])
    
    def get_version(self):
        return [("postman_version", self.report_data["environment"]["_"]["postman_exported_using"])]


class Platform:
    def __init__(self) -> None:
        kubeConfig.load_kube_config()
        self.commander = Commander()

    def get_os_name(self):
        return f"{plt.system()}"
    
    def get_platform_arch(self):
        return f"{plt.machine()} {plt.system()}"
    
    def node_version(self):
        return self.commander.get_node_version()

    def get_canvas_platform(self):
        return kubeClient.CoreV1Api().list_node().items[0].status.node_info.os_image
    
    def get_canvas_version(self):
        for api in kubeClient.ApisApi().get_api_versions().groups:
            if api.name == "oda.tmforum.org":
                return api.preferred_version.version

    def get_platform_kube_version(self):
        core_v1 = kubeClient.CoreApi().get_api_versions()
        return " / ".join(core_v1.versions)
    
    def is_canvas_certified(self):
        return True


class Component:
    def __init__(self, component_path: Path) -> None:
        self.component_path = component_path
        self.component = {}
        with self.component_path.open("r") as f:
            for chart in  yaml.load_all(f, Loader=Loader):
                if chart["kind"] == "component":
                    self.component = chart
                    break

    def get_name(self):
        if self.component:
            return self.component["metadata"]["labels"]["oda.tmforum.org/componentName"]
        else:
            return "Unknown"

    def get_version(self):
        if self.component:
            return self.component["spec"]["version"]
        else:
            return "Unknown"
        
    def get_conformance_level(self):
        return "Level 2"


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

        self.platform = Platform()
        self.component = Component(Path("../r1-productcatalog.component.yaml"))

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
                "name": report["name"].replace('-', ' ').replace('_', ' '),
                "type": report["type"].replace('-', ' ').replace('_', ' '),
                "passed": processor.get_passed(),
                "failed": processor.get_failed(),
                "skipped": processor.get_skipped(),
                "total": processor.get_total(),
                "errors": processor.get_error_count(),
            })
            self.results.update(processor.get_version())
        
        self.results.update({
            "os_name": self.platform.get_os_name(),
            "platform_arch": self.platform.get_platform_arch(),
            "node_version": self.platform.node_version(),
            "canvas_version": self.platform.get_canvas_version(),
            "platform_kube_version": self.platform.get_platform_kube_version(),
            "is_canvas_certified": self.platform.is_canvas_certified(),
            "component_name": self.component.get_name(),
            "component_version": self.component.get_version(),
            "canvas_platform": self.platform.get_canvas_platform(),
            "conformance_level": self.component.get_conformance_level(),
        })


class Commander:
    def __init__(self):
        self.node_command = ["node", "-v"]
    
    def get_node_version(self):
        output = subprocess.run(
            self.node_command, 
            capture_output=True,
            text=True
        )

        if output.returncode == 0:
            return output.stdout.strip()
        else:
            return "Unknown"

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
        self.output_path = output_path
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


        with self.output_path.joinpath("index.json").open("w+") as f:
            json.dump(self.data, f, indent=4)

        with self.output_path.joinpath("index.html").open("w+") as f:
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
                "Section_title": f"{report['name'].replace('-', ' ').replace('_', ' ')}",
                **report


            })
            

def main():
    results = ResultsProcessor()
    report_renderer = reportRenderer(results)
    report_renderer.render()
    return 0

if __name__ == "__main__":
    import sys
    sys.exit(main())