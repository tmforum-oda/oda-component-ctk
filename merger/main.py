import json
import chevron

from pathlib import Path


def load_reports():
    for report in Path("../components-ctk-reports").glob("*.html"):
        with report.open("r") as f:
            yield {
                "name": report.stem,
                "content": f.read()
            }
    pass


def gen_report(report_data):
    with open("template.html", "r") as f:
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
    with open("report.html", "w+") as f:
        f.write(generated_report)

    return 0

if __name__ == "__main__":
    import sys
    sys.exit(main())