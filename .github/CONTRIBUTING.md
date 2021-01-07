# Contribution guidance

The following outllines the process and governance for contributing to the ODA Component definitions.

* Contributions will include contributing new components, updates to the Custom Resource Definitions (that kubernetes uses to validate the data model of the component YAML), updates to the kubernetes controllers and updates to the CTKs. (NOTE: The combination of a CRD and Controller is often referred to as an operator).
* Before you create a contribution, you should create an issue against every artifact (component / operator / CTK) that you will create/update. You should also check that there are no open issues against those artifacts. This will avoid merge issues later on.
* There are multiple issue types to use:

[<img src="https://github.com/tmforum-rand/oda-component-definitions/blob/master/.github/Issues.PNG">](https://github.com/tmforum-rand/oda-component-definitions/issues)


Each issue type has its own template. e.g. a Feature uses:
```
<scope>: <subject>

<body>
```

Where `scope` is one of:
1. component (for new/updated component)
2. operator (for new or updates to the controller or custom resource definition)
3. ctk (for new/updated CTKs)


e.g. 
```
component: Sigscale OCS

Add envelope for Sigscale OCS component (https://github.com/sigscale/ocs-k8s)
```

* Once the issues have been created, create a feature-branch.
* For the git commit messages we will follow the format in http://karma-runner.github.io/4.0/dev/git-commit-msg.html . For the allowed `scope` we should use:
1. component (for new/updated component)
2. operator (for new or updates to the controller or custom resource definition)
3. test (for new/updated CTKs)

example commit message
```
feat(component): Sigscale OCS

Add envelope for Sigscale OCS component (https://github.com/sigscale/ocs-k8s)

fixes #6
```

* Finally, once a feature-branch is complete and tested, issue a pull-request to merge the feature-branch into the main branch. We will review and approve pull-requests as part of the weekly BOS Catalyst call using the guidance below to determine the impact of changes.

## Pull request governance

Pull requests should link to the issues that they are closing, and therefore document what components, custom resources & controllers and CTKs that they are changing. 

* New or changed components will not have an impact outside of their scope. The governance is just so that users understand what feature or capability has been delivered or changed.
* New or changed CTKs can make an impact of the testing/certification level of components. All deployed components should be re-tested as part of CTK deployment to understand these impacts.
* For new or changed opeators: Changes to the Custom Resource Definition that defines the Intent of the operator can have a significant impact. The change should be clearly documneted and gain wide agreement across the community creating components. The deployment of changes to CRDs should be accompanied by efforts to upgrade all components to the new standard. Changes to the controllers has a much more limited impact. 

 

