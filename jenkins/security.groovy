import jenkins.model.*
import hudson.security.*
import hudson.security.csrf.DefaultCrumbIssuer
import jenkins.security.s2m.AdminWhitelistRule

// Disable setup wizard
def instance = Jenkins.getInstance()

// Configure security
def hudsonRealm = new HudsonPrivateSecurityRealm(false)
hudsonRealm.createAccount("admin", "admin123")
instance.setSecurityRealm(hudsonRealm)

def strategy = new FullControlOnceLoggedInAuthorizationStrategy()
instance.setAuthorizationStrategy(strategy)

// Enable CSRF protection
instance.setCrumbIssuer(new DefaultCrumbIssuer(true))

// Disable CLI over remoting
instance.getDescriptor("jenkins.CLI").get().setEnabled(false)

// Enable agent to master security subsystem
instance.getInjector().getInstance(AdminWhitelistRule.class).setMasterKillSwitch(false)

instance.save()
