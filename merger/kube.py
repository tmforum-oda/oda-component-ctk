
from kubernetes import client, config


def main():
    config.load_kube_config()
    for ret in client.ApisApi().get_api_versions().groups:
        pass
        #print(ret.name)

    distro_version = client.CoreV1Api().list_node().items[0].status.node_info.os_image
    print(distro_version)

    core_v1 = client.CoreApi().get_api_versions()
    print(core_v1)

if __name__ == '__main__':
    main()