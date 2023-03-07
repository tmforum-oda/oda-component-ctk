import json
import chevron

from pathlib import Path


def process_html(html):
    return html #.replace("`", "\\`") 
        #.replace("\n","") \
        #.replace("\r","") \
        #.replace("\t","") \

def load_reports():
    base_report_path = Path("../components-ctk-reports")
    report_paths = [
        base_report_path.joinpath("L1-static-ctk.html"),
        base_report_path.joinpath("L1-dynamic-ctk.html"),
        base_report_path.joinpath("L2-static-ctk.html"),
        base_report_path.joinpath("L2-dynamic-ctk.html"),
        base_report_path.joinpath("APICTK-results.html"),
        base_report_path.joinpath("BDD-TDD.html")
       
    ]
    for report in report_paths:
        with report.open("r") as f:
            yield {
                "name": report.stem,
                "content": process_html(f.read())
            }


def gen_report(report_data):
    with open("report.mustache", "r") as f:
        template = f.read()

    template_args = {
        "template": template,
        "data": {
            "reports": report_data,
        }
    }

    return chevron.render(**template_args)

def main():
    template_data = [entry for entry in load_reports()]
    generated_report = gen_report(template_data)
    with open("../components-ctk-reports/report.html", "w+") as f:
        f.write(generated_report)

    return 0

if __name__ == "__main__":
    import sys
    sys.exit(main())