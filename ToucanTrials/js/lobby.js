(() => {
    const canvas = document.getElementById('lobbyCanvas');
    if (!canvas || !window.BABYLON) return;

    const engine = new BABYLON.Engine(canvas, true, { antialias: true, adaptToDeviceRatio: true });
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.025, 0.075, 0.055, 1);

    const camera = new BABYLON.ArcRotateCamera('lobbyCamera', -Math.PI / 2, 1.08, 27, new BABYLON.Vector3(0, 2, 0), scene);
    camera.lowerRadiusLimit = 18;
    camera.upperRadiusLimit = 34;
    camera.lowerBetaLimit = 0.7;
    camera.upperBetaLimit = 1.35;
    camera.attachControl(canvas, true);
    camera.inputs.removeByType('ArcRotateCameraKeyboardMoveInput');

    const hemi = new BABYLON.HemisphericLight('lobbyHemi', new BABYLON.Vector3(0, 1, 0), scene);
    hemi.intensity = 1.25;
    const sun = new BABYLON.DirectionalLight('lobbySun', new BABYLON.Vector3(-0.5, -1, 0.4), scene);
    sun.position = new BABYLON.Vector3(10, 25, -10);
    sun.intensity = 1.1;

    const mat = (name, color, emissive = null) => {
        const m = new BABYLON.StandardMaterial(name, scene);
        m.diffuseColor = BABYLON.Color3.FromHexString(color);
        m.specularColor = new BABYLON.Color3(0.15, 0.15, 0.15);
        if (emissive) m.emissiveColor = BABYLON.Color3.FromHexString(emissive);
        return m;
    };

    const jungle = mat('jungle', '#173b2c');
    const grass = mat('grass', '#286044');
    const stone = mat('stone', '#31443c');
    const gold = mat('gold', '#fbbf24', '#5c3d00');
    const yellow = mat('toucanYellow', '#facc15', '#3d3000');
    const cyan = mat('avatarCyan', '#22d3ee', '#063c45');
    const purple = mat('avatarPurple', '#a78bfa', '#25124c');
    const red = mat('avatarRed', '#fb7185', '#4a111c');
    const green = mat('avatarGreen', '#4ade80', '#0b3c20');

    // Definite lobby space.
    const floor = BABYLON.MeshBuilder.CreateGround('lobbyFloor', { width: 42, height: 30 }, scene);
    floor.material = grass;
    const island = BABYLON.MeshBuilder.CreateCylinder('lobbyIsland', { diameter: 30, height: 0.9, tessellation: 64 }, scene);
    island.position.y = -0.5;
    island.material = jungle;

    for (let i = 0; i < 18; i++) {
        const angle = i / 18 * Math.PI * 2;
        const r = 15 + (i % 3) * 1.4;
        const tree = BABYLON.MeshBuilder.CreateCylinder('treeTrunk' + i, { diameter: 0.55, height: 3 + (i % 3) }, scene);
        tree.position = new BABYLON.Vector3(Math.cos(angle) * r, 1.5, Math.sin(angle) * r * 0.68);
        tree.material = stone;
        const crown = BABYLON.MeshBuilder.CreateSphere('treeCrown' + i, { diameter: 3.4 + (i % 2), segments: 12 }, scene);
        crown.position = tree.position.add(new BABYLON.Vector3(0, 2.5, 0));
        crown.material = jungle;
    }

    const makeBlob = (name, position, material, scale = 1) => {
        const root = new BABYLON.TransformNode(name, scene);
        root.position = position.clone();
        const body = BABYLON.MeshBuilder.CreateSphere(name + 'Body', { diameter: 2, segments: 20 }, scene);
        body.parent = root;
        body.scaling = new BABYLON.Vector3(1, 0.8, 1);
        body.material = material;
        const eyeL = BABYLON.MeshBuilder.CreateSphere(name + 'EyeL', { diameter: 0.22 }, scene);
        const eyeR = eyeL.clone(name + 'EyeR');
        eyeL.parent = root; eyeR.parent = root;
        eyeL.position = new BABYLON.Vector3(-0.34, 0.27, -0.82);
        eyeR.position = new BABYLON.Vector3(0.34, 0.27, -0.82);
        const eyeMat = mat(name + 'EyeMat', '#101010');
        eyeL.material = eyeMat; eyeR.material = eyeMat;
        root.scaling = new BABYLON.Vector3(scale, scale, scale);
        return root;
    };

    // Main player: yellow blob continuously roams inside the marked area.
    const player = makeBlob('lobbyPlayer', new BABYLON.Vector3(0, 1, 2), yellow, 1.15);
    const roam = { t: 0, a: 0, b: 0 };

    // Other avatars. Clicking/tapping them opens their information panel.
    const avatars = [
        { id: 'ranger', name: 'RANGER', title: 'Canopy Scout', description: 'Fast, fearless and always looking for the next shortcut.', color: cyan, pos: new BABYLON.Vector3(-7, 1, -2) },
        { id: 'moss', name: 'MOSS', title: 'Jungle Veteran', description: 'Knows every rock, route and dangerous jump in the canopy.', color: green, pos: new BABYLON.Vector3(7, 1, -2) },
        { id: 'ember', name: 'EMBER', title: 'Speedrunner', description: 'Lives for perfect dashes and brutally fast records.', color: red, pos: new BABYLON.Vector3(-5, 1, 7) },
        { id: 'nova', name: 'NOVA', title: 'Trial Master', description: 'A mysterious challenger waiting for someone to beat the leaderboard.', color: purple, pos: new BABYLON.Vector3(5, 1, 7) }
    ];

    avatars.forEach(a => {
        a.mesh = makeBlob(a.id, a.pos, a.color, 1.0);
        a.mesh.metadata = { avatar: a };
        a.mesh.getChildMeshes().forEach(m => m.metadata = { avatar: a });
    });

    // Central golden play pedestal.
    const pedestal = BABYLON.MeshBuilder.CreateCylinder('playPedestal', { diameter: 3.6, height: 0.6, tessellation: 32 }, scene);
    pedestal.position = new BABYLON.Vector3(0, 0.35, -2.8);
    pedestal.material = gold;
    const playRing = BABYLON.MeshBuilder.CreateTorus('playRing', { diameter: 4.2, thickness: 0.12, tessellation: 48 }, scene);
    playRing.position = pedestal.position.add(new BABYLON.Vector3(0, 0.4, 0));
    playRing.material = gold;

    const ray = scene.createPickingRay(0, 0, BABYLON.Matrix.Identity(), camera);
    scene.onPointerObservable.add(info => {
        if (info.type !== BABYLON.PointerEventTypes.POINTERPICK) return;
        const picked = info.pickInfo?.pickedMesh;
        const avatar = picked?.metadata?.avatar;
        if (avatar) showAvatar(avatar);
    });

    const panel = document.getElementById('avatarPanel');
    const title = document.getElementById('avatarTitle');
    const subtitle = document.getElementById('avatarSubtitle');
    const description = document.getElementById('avatarDescription');
    function showAvatar(a) {
        title.textContent = a.name;
        subtitle.textContent = a.title;
        description.textContent = a.description;
        panel.classList.add('open');
    }
    window.closeAvatarPanel = () => panel.classList.remove('open');

    document.getElementById('playButton').addEventListener('click', () => location.href = 'game.html');
    document.getElementById('leaderboardButton').addEventListener('click', async () => {
        await loadLeaderboard();
        document.getElementById('leaderboardPanel').classList.add('open');
    });
    document.getElementById('statsButton').addEventListener('click', async () => {
        await loadStats();
        document.getElementById('statsPanel').classList.add('open');
    });
    document.getElementById('closeLeaderboard').onclick = () => document.getElementById('leaderboardPanel').classList.remove('open');
    document.getElementById('closeStats').onclick = () => document.getElementById('statsPanel').classList.remove('open');
    document.getElementById('logoutButton').onclick = async () => { await ToucanAuth.signOut(); location.href = 'auth.html'; };

    async function getProfile() {
        const user = await ToucanAuth.getUser();
        if (!user) return null;
        const { data } = await supabaseClient.from('profiles').select('id,username,total_coins').eq('id', user.id).maybeSingle();
        if (!data) { location.href = 'profile.html'; return null; }
        return { user, profile: data };
    }

    async function loadStats() {
        const result = await getProfile();
        if (!result) return;
        document.getElementById('statsName').textContent = result.profile.username || 'Player';
        document.getElementById('statsCoins').textContent = Number(result.profile.total_coins || 0).toLocaleString();
        try {
            const best = await ToucanScores.getPersonalBest('level_1');
            document.getElementById('statsBest').textContent = best == null ? '--:--.---' : formatTime(best);
        } catch { document.getElementById('statsBest').textContent = '--:--.---'; }
    }

    async function loadLeaderboard() {
        const list = document.getElementById('leaderboardList');
        list.innerHTML = '<div class="lobby-status">Loading...</div>';
        try {
            const { data, error } = await supabaseClient.rpc('get_leaderboard', { p_level_id: 'level_1' });
            if (error) throw error;
            list.innerHTML = (data || []).slice(0, 10).map((p, i) => `<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.08)"><b>#${i + 1} ${escapeHtml(p.username || 'Player')}</b><span style="color:#34d399">${formatTime(p.best_time_ms)}</span></div>`).join('') || '<div class="lobby-status">No completed runs yet.</div>';
        } catch (e) { list.innerHTML = '<div style="color:#fb7185">Leaderboard unavailable.</div>'; console.error(e); }
    }

    const escapeHtml = value => String(value).replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
    const formatTime = ms => {
        const n = Math.max(0, Number(ms));
        if (!Number.isFinite(n)) return '--:--.---';
        return `${String(Math.floor(n / 60000)).padStart(2,'0')}:${String(Math.floor(n / 1000) % 60).padStart(2,'0')}.${String(Math.floor(n % 1000)).padStart(3,'0')}`;
    };

    async function requireProfile() {
        const user = await ToucanAuth.getUser();
        if (!user) { location.href = 'auth.html'; return false; }
        const { data } = await supabaseClient.from('profiles').select('id').eq('id', user.id).maybeSingle();
        if (!data) { location.href = 'profile.html'; return false; }
        document.getElementById('playerName').textContent = user.user_metadata?.username || user.email?.split('@')[0] || 'PLAYER';
        return true;
    }

    requireProfile();

    scene.onBeforeRenderObservable.add(() => {
        const dt = engine.getDeltaTime() / 1000;
        roam.t += dt;
        const x = Math.sin(roam.t * 0.36) * 7.2;
        const z = Math.cos(roam.t * 0.28) * 4.6;
        player.position.x += (x - player.position.x) * Math.min(1, dt * 1.8);
        player.position.z += (z - player.position.z) * Math.min(1, dt * 1.8);
        player.position.y = 1 + Math.sin(roam.t * 3.0) * 0.08;
        player.rotation.y += dt * 0.6;
        avatars.forEach((a, i) => { a.mesh.position.y = 1 + Math.sin(roam.t * 1.5 + i) * 0.06; a.mesh.rotation.y += dt * (i % 2 ? -0.2 : 0.2); });
        playRing.rotation.y += dt;
    });

    engine.runRenderLoop(() => scene.render());
    addEventListener('resize', () => engine.resize());
})();