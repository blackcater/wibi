### 外观

`appearance` 属性设置导航栏外观:

- 'default'(默认值) 默认导航栏。
- 'inverse' 反色的导航栏。
- 'subtle' 弱化的导航栏。

<!--start-code-->

```vue
<template>
  <div>
    <div style="width: 250px;display: inline-block; margin: 0 10px 50px 0;">
      <Sidenav :defaultOpenKeys="['3', '4']">
        <SidenavBody>
          <Nav>
            <NavItem eventKey="1" active icon="dashboard">Dashboard</NavItem>
            <NavItem eventKey="2" icon="group">User Group</NavItem>
            <Dropdown eventKey="3" title="Advanced" icon="magic">
              <DropdownItem eventKey="3-1">Geo</DropdownItem>
              <DropdownItem eventKey="3-2">Devices</DropdownItem>
              <DropdownItem eventKey="3-3">Loyalty</DropdownItem>
              <DropdownItem eventKey="3-4">Visit Depth</DropdownItem>
            </Dropdown>
            <Dropdown eventKey="4" title="Settings" icon="gear-circle">
              <DropdownItem eventKey="4-1">Applications</DropdownItem>
              <DropdownItem eventKey="4-2">Channels</DropdownItem>
              <DropdownItem eventKey="4-3">Versions</DropdownItem>
              <DropdownMenu eventKey="4-5" title="Custom Action">
                <DropdownItem eventKey="4-5-1">Action Name</DropdownItem>
                <DropdownItem eventKey="4-5-2">
                  Action Params
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </Nav>
        </SidenavBody>
      </Sidenav>
    </div>

    <div style="width: 250px;display: inline-block; margin: 0 10px 50px 0;">
      <Sidenav appearance="inverse" :defaultOpenKeys="['3', '4']">
        <SidenavBody>
          <Nav>
            <NavItem eventKey="1" active icon="dashboard">Dashboard</NavItem>
            <NavItem eventKey="2" icon="group">User Group</NavItem>
            <Dropdown eventKey="3" title="Advanced" icon="magic">
              <DropdownItem eventKey="3-1">Geo</DropdownItem>
              <DropdownItem eventKey="3-2">Devices</DropdownItem>
              <DropdownItem eventKey="3-3">Loyalty</DropdownItem>
              <DropdownItem eventKey="3-4">Visit Depth</DropdownItem>
            </Dropdown>
            <Dropdown eventKey="4" title="Settings" icon="gear-circle">
              <DropdownItem eventKey="4-1">Applications</DropdownItem>
              <DropdownItem eventKey="4-2">Channels</DropdownItem>
              <DropdownItem eventKey="4-3">Versions</DropdownItem>
              <DropdownMenu eventKey="4-5" title="Custom Action">
                <DropdownItem eventKey="4-5-1">Action Name</DropdownItem>
                <DropdownItem eventKey="4-5-2">
                  Action Params
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </Nav>
        </SidenavBody>
      </Sidenav>
    </div>

    <div style="width: 250px;display: inline-block; margin: 0 10px 50px 0;">
      <Sidenav appearance="subtle" :defaultOpenKeys="['3', '4']">
        <SidenavBody>
          <Nav>
            <NavItem eventKey="1" active icon="dashboard">Dashboard</NavItem>
            <NavItem eventKey="2" icon="group">User Group</NavItem>
            <Dropdown eventKey="3" title="Advanced" icon="magic">
              <DropdownItem eventKey="3-1">Geo</DropdownItem>
              <DropdownItem eventKey="3-2">Devices</DropdownItem>
              <DropdownItem eventKey="3-3">Loyalty</DropdownItem>
              <DropdownItem eventKey="3-4">Visit Depth</DropdownItem>
            </Dropdown>
            <Dropdown eventKey="4" title="Settings" icon="gear-circle">
              <DropdownItem eventKey="4-1">Applications</DropdownItem>
              <DropdownItem eventKey="4-2">Channels</DropdownItem>
              <DropdownItem eventKey="4-3">Versions</DropdownItem>
              <DropdownMenu eventKey="4-5" title="Custom Action">
                <DropdownItem eventKey="4-5-1">Action Name</DropdownItem>
                <DropdownItem eventKey="4-5-2">
                  Action Params
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </Nav>
        </SidenavBody>
      </Sidenav>
    </div>
  </div>
</template>
```

<!--end-code-->
