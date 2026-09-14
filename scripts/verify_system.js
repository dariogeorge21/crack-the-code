const baseUrl = 'http://localhost:3000';

async function testAll() {
  console.log('=== STARTING END-TO-END SYSTEM & SECURITY VERIFICATION ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log('  [PASS]', message);
      passed++;
    } else {
      console.error('  [FAIL]', message);
      failed++;
    }
  }

  // 1. Check game status
  try {
    const res = await fetch(baseUrl + '/api/game/status');
    const data = await res.json();
    assert(res.status === 200 && data.lastResetAt, 'GET /api/game/status returns 200 and reset timestamp');
  } catch (e) {
    assert(false, 'GET /api/game/status failed: ' + e.message);
  }

  // 2. Admin Security Checks
  console.log('\n--- Checking Admin Security & Protection ---');
  let adminCookie = '';
  try {
    let res = await fetch(baseUrl + '/api/admin/teams');
    assert(res.status === 401, 'Unauthenticated GET /api/admin/teams is blocked (401)');

    res = await fetch(baseUrl + '/api/admin/generate-teams', { method: 'POST' });
    assert(res.status === 401, 'Unauthenticated POST /api/admin/generate-teams is blocked (401)');

    res = await fetch(baseUrl + '/api/admin/reset-game', { method: 'POST' });
    assert(res.status === 401, 'Unauthenticated POST /api/admin/reset-game is blocked (401)');

    res = await fetch(baseUrl + '/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'badpassword' })
    });
    assert(res.status === 401, 'Admin login with bad password fails (401)');

    // Legitimate login
    res = await fetch(baseUrl + '/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'csea1to4' })
    });
    assert(res.status === 200, 'Admin login with csea1to4 succeeds (200)');
    const cookie = res.headers.get('set-cookie');
    assert(cookie && cookie.includes('admin_session='), 'Admin login returned admin_session HttpOnly cookie');

    adminCookie = cookie ? cookie.split(';')[0] : '';

    // Reset game to fresh state for clean testing
    res = await fetch(baseUrl + '/api/admin/generate-teams', {
      method: 'POST',
      headers: { 'Cookie': adminCookie }
    });
    assert(res.status === 200, 'Admin generate-teams succeeds with session cookie');

    // Authenticated admin actions
    res = await fetch(baseUrl + '/api/admin/teams', { headers: { 'Cookie': adminCookie } });
    const teamsData = await res.json();
    assert(res.status === 200 && teamsData.teams && teamsData.teams.length === 11, 'Admin GET /api/admin/teams returns all 11 teams');

    // Admin status check via GET /api/admin/login
    res = await fetch(baseUrl + '/api/admin/login', { headers: { 'Cookie': adminCookie } });
    const authStatus = await res.json();
    assert(authStatus.authenticated === true, 'Admin session verified active via GET /api/admin/login');

  } catch (e) {
    assert(false, 'Admin test exception: ' + e.message);
  }

  // 3. Compiler Command Injection & Sandbox Security Checks
  console.log('\n--- Checking Compiler Sandboxing & Command Injection Defense ---');
  try {
    // Attack 1: C code calling system()
    let res = await fetch(baseUrl + '/api/compiler/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'c',
        code: '#include <stdio.h>\n#include <stdlib.h>\nint main(){ system("whoami"); return 0; }',
        round: 2
      })
    });
    let data = await res.json();
    assert(data.error && data.error.includes('SECURITY VIOLATION') && data.error.includes('system()'), 'Compiler intercepts and blocks C system() command injection');

    // Attack 2: C code calling getenv("ADMIN_PASSWORD")
    res = await fetch(baseUrl + '/api/compiler/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'c',
        code: '#include <stdio.h>\n#include <stdlib.h>\nint main(){ printf("%s", getenv("ADMIN_PASSWORD")); return 0; }',
        round: 2
      })
    });
    data = await res.json();
    assert(data.error && data.error.includes('SECURITY VIOLATION') && data.error.includes('getenv'), 'Compiler intercepts and blocks C getenv() secret sniffing');

    // Attack 3: C code including windows.h
    res = await fetch(baseUrl + '/api/compiler/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'c',
        code: '#include <stdio.h>\n#include <windows.h>\nint main(){ WinExec("calc", 1); return 0; }',
        round: 2
      })
    });
    data = await res.json();
    assert(data.error && data.error.includes('SECURITY VIOLATION'), 'Compiler intercepts and blocks restricted system headers');

    // Attack 4: Python code importing os and subprocess
    res = await fetch(baseUrl + '/api/compiler/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'python',
        code: 'import os\nos.system("dir")',
        round: 2
      })
    });
    data = await res.json();
    assert(data.error && data.error.includes('SECURITY VIOLATION') && data.error.includes('OS module'), 'Compiler intercepts and blocks Python os.system execution');

    // Attack 5: Python code attempting to open files
    res = await fetch(baseUrl + '/api/compiler/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'python',
        code: 'print(open(".env.local").read())',
        round: 2
      })
    });
    data = await res.json();
    assert(data.error && data.error.includes('SECURITY VIOLATION') && data.error.includes('file system'), 'Compiler intercepts and blocks Python open() file access');

    // Attack 6: Java code calling Runtime.getRuntime()
    res = await fetch(baseUrl + '/api/compiler/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'java',
        code: 'public class Main { public static void main(String[] args) throws Exception { Runtime.getRuntime().exec("whoami"); } }',
        round: 2
      })
    });
    data = await res.json();
    assert(data.error && data.error.includes('SECURITY VIOLATION') && data.error.includes('Runtime process'), 'Compiler intercepts and blocks Java process execution');

  } catch (e) {
    assert(false, 'Compiler security test exception: ' + e.message);
  }

  // 4. Participant Game Flow Checks
  console.log('\n--- Checking Participant Gameplay Flow ---');
  let testTeamCode = null;
  try {
    const teamsRes = await fetch(baseUrl + '/api/admin/teams', { headers: { 'Cookie': adminCookie } });
    const teamsData = await teamsRes.json();
    const team1 = teamsData.teams.find(t => t.team_number === 1);
    testTeamCode = team1.team_code;
    assert(Boolean(testTeamCode), 'Obtained Team 01 code: ' + testTeamCode);
  } catch (e) {
    assert(false, 'Failed to fetch team code: ' + e.message);
  }

  if (testTeamCode) {
    try {
      // Step A: Verify Code
      let res = await fetch(baseUrl + '/api/game/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: testTeamCode })
      });
      let data = await res.json();
      assert(res.status === 200 && data.success, 'POST /api/game/verify-code with valid team code succeeds');

      // Step B: Submit Round 1
      res = await fetch(baseUrl + '/api/game/submit-round1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamCode: testTeamCode,
          round1Answer: 'ECHO',
          firstDigit: 5
        })
      });
      data = await res.json();
      assert(res.status === 200 && data.success && data.currentLevel >= 2, 'POST /api/game/submit-round1 advances team to Level 2');
      const savedMasterCode = data.team.master_code;

      // Step C: Compiler Execution - Round 2 Diamond (Legitimate C code)
      const diamondCode = `#include <stdio.h>
int main() {
    int n = 5;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n - i; j++) printf(" ");
        for (int j = 1; j <= 2 * i - 1; j++) printf("*");
        printf("\\n");
    }
    for (int i = n - 1; i >= 1; i--) {
        for (int j = 1; j <= n - i; j++) printf(" ");
        for (int j = 1; j <= 2 * i - 1; j++) printf("*");
        printf("\\n");
    }
    return 0;
}`;
      res = await fetch(baseUrl + '/api/compiler/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: 'c', code: diamondCode, round: 2 })
      });
      data = await res.json();
      assert(res.status === 200 && data.isCorrect === true && data.accessCode === '88', 'POST /api/compiler/run validates Round 2 C Diamond correctly (Access Code: 88)');

      // Step D: Submit Round 2 Access Code
      res = await fetch(baseUrl + '/api/game/submit-round2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamCode: testTeamCode, accessCode: '88' })
      });
      data = await res.json();
      assert(res.status === 200 && data.success && data.currentLevel >= 3, 'POST /api/game/submit-round2 advances team to Level 3');

      // Step E: Compiler Execution - Round 3 Airport (Legitimate C code)
      const airportCode = `#include <stdio.h>
int main() {
    printf("Rahul\\nAnu\\nMaria\\nJohn\\n41\\n");
    return 0;
}`;
      res = await fetch(baseUrl + '/api/compiler/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: 'c', code: airportCode, round: 3 })
      });
      data = await res.json();
      assert(res.status === 200 && data.isCorrect === true && data.accessCode === '41', 'POST /api/compiler/run validates Round 3 Airport solution (Access Code: 41)');

      // Step F: Submit Round 3 Access Code
      res = await fetch(baseUrl + '/api/game/submit-round3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamCode: testTeamCode, accessCode: '41' })
      });
      data = await res.json();
      assert(res.status === 200 && data.success && data.currentLevel >= 4, 'POST /api/game/submit-round3 advances team to Level 4');

      // Step G: Submit Round 4 CTF Flag
      res = await fetch(baseUrl + '/api/game/submit-round4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamCode: testTeamCode, flag: 'FLAG{alex_left_more_than_a_message}' })
      });
      data = await res.json();
      assert(res.status === 200 && data.success && data.gameWon === true, 'POST /api/game/submit-round4 validates CTF Flag and declares team Winner (gameWon: true)');

      // Step H: Anti-Downgrade Test: Resubmitting Round 1 does NOT downgrade Level 4 winner
      res = await fetch(baseUrl + '/api/game/submit-round1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamCode: testTeamCode,
          round1Answer: 'NEW_TAMPERED_ANSWER',
          firstDigit: 9
        })
      });
      data = await res.json();
      assert(res.status === 200 && data.currentLevel >= 4, 'Level 1 Anti-Downgrade protection preserves team level');

      // Step I: Leaderboard Check
      res = await fetch(baseUrl + '/api/game/leaderboard');
      data = await res.json();
      const top = data.leaderboard && data.leaderboard[0];
      assert(res.status === 200 && top && top.team_number === 1 && top.is_winner === true, 'GET /api/game/leaderboard reflects winning team with level split metrics');

    } catch (e) {
      assert(false, 'Participant flow exception: ' + e.message);
    }
  }

  // 5. Page Rendering Check
  console.log('\n--- Checking Web Pages HTTP Response ---');
  const pages = ['/', '/level2', '/level3', '/level4', '/round2', '/round3', '/round4', '/admin/dashboard'];
  for (const page of pages) {
    try {
      const res = await fetch(baseUrl + page);
      assert(res.status === 200, 'Page ' + page + ' returns HTTP 200 OK');
    } catch (e) {
      assert(false, 'Page ' + page + ' failed: ' + e.message);
    }
  }

  console.log('\n=== VERIFICATION SUMMARY ===');
  console.log('Total Tests Run:', passed + failed);
  console.log('Passed:', passed);
  console.log('Failed:', failed);
  if (failed > 0) {
    process.exit(1);
  }
}

testAll();
